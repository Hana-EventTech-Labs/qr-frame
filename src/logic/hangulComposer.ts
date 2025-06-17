// hangulComposer.ts

export class HangulComposer {
    private CHOSUNG = [
      'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
      'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];
  
    private JUNGSUNG = [
      'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
      'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
    ];
  
    private JONGSUNG = [
      '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ',
      'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ',
      'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];
  
    // private DOUBLE_CONSONANT_MAP: Record<string, string> = {
    //   'ㄱ': 'ㄲ', 'ㄷ': 'ㄸ', 'ㅂ': 'ㅃ', 'ㅅ': 'ㅆ', 'ㅈ': 'ㅉ'
    // };
  
    private COMPLEX_JONGSUNG_MAP: Record<string, string> = {
      'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ',
      'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
    };
  
    private COMPLEX_VOWEL_MAP: Record<string, string> = {
      'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
      'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
      'ㅡㅣ': 'ㅢ'
    };
  
    private REVERSE_COMPLEX_JONGSUNG: Record<string, [string, string]> = {};
  
    public cho: string | null = null;
    public jung: string | null = null;
    public jong: string | null = null;
    public currentText: string = '';
  
    constructor() {
      Object.entries(this.COMPLEX_JONGSUNG_MAP).forEach(([k, v]) => {
        this.REVERSE_COMPLEX_JONGSUNG[v] = [k[0], k[1]];
      });
      this.reset();
    }
  
    reset() {
      this.cho = null;
      this.jung = null;
      this.jong = null;
      this.currentText = '';
    }
  
    private tryComplexJongsung(current: string, next: string): string {
      return this.COMPLEX_JONGSUNG_MAP[current + next] || next;
    }
  
    addJamo(jamo: string): [string | null, string] {
      let result: string | null = null;
  
      if (this.CHOSUNG.includes(jamo)) {
        if (!this.cho && !this.jung) {
          this.cho = jamo;
        } else if (this.cho && this.jung) {
          if (!this.jong) {
            if (this.JONGSUNG.includes(jamo)) {
              this.jong = jamo;
            } else {
              result = this.commit();
              this.cho = jamo;
            }
          } else {
            const complex = this.tryComplexJongsung(this.jong, jamo);
            if (complex !== jamo) {
              this.jong = complex;
            } else {
              result = this.commit();
              this.cho = jamo;
            }
          }
        } else {
          result = this.commit();
          this.cho = jamo;
        }
      } else if (this.JUNGSUNG.includes(jamo)) {
        if (this.cho && this.jung && !this.jong) {
          const compound = this.COMPLEX_VOWEL_MAP[this.jung + jamo];
          if (compound) {
            this.jung = compound;
            this.currentText = this.combine() || '';
            return [result, this.currentText];
          }
        }
        if (this.jong) {
          const reverse = this.REVERSE_COMPLEX_JONGSUNG[this.jong];
          if (reverse) {
            this.jong = reverse[0];
            result = this.commit();
            this.cho = reverse[1];
          } else {
            const newCho = this.jong;
            this.jong = null;
            result = this.commit();
            this.cho = newCho;
          }
          this.jung = jamo;
        } else if (this.cho && !this.jung) {
          this.jung = jamo;
        } else {
          result = this.commit();
          this.jung = jamo;
        }
      }
  
      this.currentText = this.combine() || '';
      return [result, this.currentText];
    }
  
    backspace(): [string, boolean] {
      let changed = false;
  
      if (this.cho && this.jung) {
        if (this.jong) {
          if (this.REVERSE_COMPLEX_JONGSUNG[this.jong]) {
            this.jong = this.REVERSE_COMPLEX_JONGSUNG[this.jong][0];
          } else {
            this.jong = null;
          }
          changed = true;
        } else if (this.jung) {
          this.jung = null;
          changed = true;
        } else if (this.cho) {
          this.cho = null;
          changed = true;
        }
      } else {
        this.reset();
        changed = true;
      }
  
      this.currentText = this.combine() || '';
      return [this.currentText, changed];
    }
  
    combine(): string | null {
      if (this.cho && this.jung) {
        const choIdx = this.CHOSUNG.indexOf(this.cho);
        const jungIdx = this.JUNGSUNG.indexOf(this.jung);
        const jongIdx = this.jong ? this.JONGSUNG.indexOf(this.jong) : 0;
        const code = 0xac00 + choIdx * 588 + jungIdx * 28 + jongIdx;
        return String.fromCharCode(code);
      } else if (this.cho) {
        return this.cho;
      } else if (this.jung) {
        return this.jung;
      }
      return null;
    }
  
    commit(): string | null {
      const result = this.combine();
      this.reset();
      return result;
    }
  }
  