const { contextBridge } = require('electron');
const path = require('path');
const koffi = require('koffi');
const fs = require('fs');
const isDev = process.argv.includes('--dev'); // ✅ 직접 플래그 확인

// DLL 경로 설정
const dllPath = isDev
  ? path.join(__dirname, 'resources', 'SmartComm2.dll') // dev에서는 여기
  : path.join(process.resourcesPath, 'resources', 'SmartComm2.dll'); // prod에서는 여기
console.log('📂 DLL 경로:', dllPath);
console.log('📦 Koffi 버전:', koffi.version);
console.log('🧠 Electron arch:', process.arch);

// DLL 파일 존재 확인
if (!fs.existsSync(dllPath)) {
  console.error('❌ DLL 파일이 존재하지 않습니다:', dllPath);
  throw new Error(`DLL 파일을 찾을 수 없습니다: ${dllPath}`);
}
console.log('✅ DLL 파일 확인됨');

// DLL 로드
const smart = koffi.load(dllPath);
console.log('✅ DLL 로드 성공');

// 구조체 정의
const SMART_PRINTER_ITEM = koffi.struct('SMART_PRINTER_ITEM', {
  name: 'uint16[128]',
  id: 'uint16[64]',
  dev: 'uint16[64]',
  desc: 'uint16[256]',
  pid: 'int'
});

const SMART_PRINTER_LIST = koffi.struct('SMART_PRINTER_LIST', {
  n: 'int',
  item: koffi.array(SMART_PRINTER_ITEM, 32)
});

const DRAWTEXT2INFO = koffi.struct('DRAWTEXT2INFO', {
  x: 'int',
  y: 'int',
  cx: 'int',
  cy: 'int',
  rotate: 'int',
  align: 'int',
  fontHeight: 'int',
  fontWidth: 'int',
  style: 'int',
  color: 'uint32_t',
  option: 'int',
  szFaceName: koffi.array('wchar_t', 32) // wchar_t 배열로 복원
});

// DLL 함수 정의
const SmartComm_GetDeviceList2 = smart.stdcall('SmartComm_GetDeviceList2', 'int', ['void *']);
const SmartComm_OpenDevice2 = smart.stdcall('SmartComm_OpenDevice2', 'int', ['void **', 'void *', 'int']);
const SmartComm_DrawImage = smart.stdcall('SmartComm_DrawImage', 'int', ['void *', 'uint8', 'uint8', 'int', 'int', 'int', 'int', 'void *', 'void *']);
const SmartComm_DrawText2 = smart.stdcall('SmartComm_DrawText', 'int', ['void *', 'uint8', 'uint8', 'int', 'int', 'void *', 'int', 'uint8', 'void *', 'void *']);
const SmartComm_Print = smart.stdcall('SmartComm_Print', 'int', ['void *']);
const SmartComm_CloseDevice = smart.stdcall('SmartComm_CloseDevice', 'int', ['void *']);
const rectPtr = koffi.pointer('RECT', koffi.opaque()); // 반환값 무시할 거면 null 가능

let currentHandle = null;

// UTF-16LE 문자열 디코딩 함수
const decodeWString = (uint16Array) => {
  return Buffer.from(uint16Array.buffer).toString('utf16le').replace(/\0/g, '');
};

// Electron 프린터 API 노출
contextBridge.exposeInMainWorld('printerApi', {
  getDeviceList: async () => {
    try {
      console.log('🔄 프린터 목록 조회 시작');

      const printerListSize = koffi.sizeof(SMART_PRINTER_LIST);
      const printerListBuffer = Buffer.alloc(printerListSize);

      const result = SmartComm_GetDeviceList2(printerListBuffer);
      console.log('📊 SmartComm_GetDeviceList2 결과:', result);

      if (result !== 0) {
        return { success: false, error: `프린터 목록 조회 실패 (코드 ${result})` };
      }

      const parsed = koffi.decode(printerListBuffer, SMART_PRINTER_LIST);
      const devices = parsed.item.slice(0, parsed.n).map((device, idx) => {
        const name = decodeWString(device.name);
        const id = decodeWString(device.id);
        const dev = decodeWString(device.dev);
        const desc = decodeWString(device.desc);

        // ✅ 프린터 리스트 출력 (디버그용)
        console.log(`📋 프린터[${idx}]`);
        console.log(`   name: ${JSON.stringify(name)}`);
        console.log(`   id  : ${JSON.stringify(id)}`);
        console.log(`   dev : ${JSON.stringify(dev)}`);
        console.log(`   desc: ${JSON.stringify(desc)} (길이: ${desc.length})`);

        return {
          name,
          id,
          dev,
          description: desc,
          pid: device.pid
        };
      });

      return { success: true, devices };
    } catch (err) {
      console.error('❌ 장치 목록 예외 발생:', err);
      return { success: false, error: err.message };
    }
  },

  openDevice: async (id) => {
    try {
      console.log('🔌 장치 열기 시도:', id);
      console.log('🔤 넘긴 id 내용:', JSON.stringify(id));
      console.log('🔤 길이:', id.length);

      const handlePtr = Buffer.alloc(koffi.sizeof('void *'));
      const idBuf = Buffer.from(id + '\0', 'utf16le'); // ✅ null-terminated UTF-16LE

      const result = SmartComm_OpenDevice2(handlePtr, idBuf, 0); // 1 = ID 기준으로 열기
      console.log('📟 openDevice2 결과:', result);

      if (result !== 0) {
        return { success: false, error: `장치 열기 실패 (코드 ${result})` };
      }

      currentHandle = koffi.decode(handlePtr, 'void *');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  ,

  drawImage: async ({ page, panel, x, y, width, height, imagePath }) => {
    try {
      if (!currentHandle) return { success: false, error: '프린터가 연결되지 않았습니다.' };

      const imgPathBuf = Buffer.from(imagePath + '\0', 'utf16le');

      const result = SmartComm_DrawImage(
        currentHandle,
        page,
        panel,
        x,
        y,
        width,
        height,
        imgPathBuf,
        null // prcArea 안 쓸 거면 null
      );

      if (result !== 0) {
        return { success: false, error: `DrawImage 실패 (코드 ${result})` };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  drawText: async ({ page, panel, x, y, fontName, fontSize, fontStyle, text }) => {
    try {
      if (!currentHandle) return { success: false, error: '프린터가 연결되지 않았습니다.' };
  
      console.log('📝 텍스트 그리기 시작:', text);
      console.log('📝 폰트 이름:', fontName);
      
      const fontNameBuf = Buffer.from(fontName + '\0', 'utf16le');
      const textBuf = Buffer.from(text + '\0', 'utf16le');

      const result = SmartComm_DrawText2(
        currentHandle,
        page,
        panel,
        x,
        y,
        fontNameBuf,
        fontSize,
        fontStyle,
        textBuf,
        null
      );
      
      console.log('📝 텍스트 결과:', result);
      
      if (result !== 0) {
        return { success: false, error: `DrawText 실패 (코드 ${result})` };
      }
      
      return { success: true };
    } catch (err) {
      console.error('🔴 drawText 예외:', err);
      return { success: false, error: err.message };
    }
  },

  print: async () => {
    try {
      console.log('🖨 인쇄 시작');
      if (!currentHandle) return { success: false, error: '연결된 장치 없음' };

      const result = SmartComm_Print(currentHandle);
      return result === 0
        ? { success: true }
        : { success: false, error: `인쇄 실패 (코드 ${result})` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  closeDevice: async () => {
    try {
      console.log('🔌 장치 닫기');
      if (!currentHandle) return { success: true };

      const result = SmartComm_CloseDevice(currentHandle);
      currentHandle = null;
      return result === 0
        ? { success: true }
        : { success: false, error: `장치 닫기 실패 (코드 ${result})` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getPreviewImage: async () => {
    return { success: false, error: '미구현' };
  }
});

contextBridge.exposeInMainWorld('envApi', {
  cwd: () => process.cwd()
});

const os = require('os');

contextBridge.exposeInMainWorld('env', {
  cwd: () => process.cwd(),
  downloadPath: () => path.join(os.homedir(), 'Downloads')
});

// 파일 저장 API 추가
contextBridge.exposeInMainWorld('fileApi', {
  // 이미지 URL을 다운로드 폴더에 저장하는 함수
  saveImageFromUrl: async (url, filename = 'photo.png') => {
    try {
      console.log('🔽 이미지 저장 시작:', url, '→', filename);
      
      // 이미지 가져오기
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 다운로드 폴더 경로
      const downloadPath = path.join(os.homedir(), 'Downloads');
      const filePath = path.join(downloadPath, filename);
      
      // 파일 쓰기
      fs.writeFileSync(filePath, buffer);
      console.log('✅ 이미지 저장 완료:', filePath);
      
      return { success: true, filePath };
    } catch (error) {
      console.error('❌ 이미지 저장 오류:', error);
      return { success: false, error: error.message };
    }
  }
});

// Electron 앱 종료 API 추가
contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => {
    console.log('🔴 앱 종료 요청');
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('app:quit');
  }
});