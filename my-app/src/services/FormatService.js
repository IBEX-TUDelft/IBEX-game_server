const emptyValue = { value: '' };

export default class FormatService {
    locale;

    constructor(locale) {
        this.locale = locale;
        var _a, _b;
        const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
        const numerals = [
            ...new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210),
        ].reverse();
        const index = new Map(numerals.map((d, i) => [d, i]));
        this._group = new RegExp(`[${((_a = parts.find((d) => d.type === 'group')) !== null && _a !== void 0 ? _a : emptyValue).value}]`, 'g');
        this._decimal = new RegExp(`[${((_b = parts.find((d) => d.type === 'decimal')) !== null && _b !== void 0 ? _b : emptyValue).value}]`);
        this._numeral = new RegExp(`[${numerals.join('')}]`, 'g');
        this._index = (numeralGroup) => { var _a; return ((_a = index.get(numeralGroup)) !== null && _a !== void 0 ? _a : -1).toString(); };
    }

    parse(localizedString) {
        if (localizedString == null) {
            return null;
        }

        const numericString = localizedString
            .trim()
            .replace(this._group, '')
            .replace(this._decimal, '.')
            .replace(this._numeral, this._index);
        return numericString ? Number(numericString) : NaN;
    }

    reformat(string) {
        const num = this.parse(string);

        if (num == null) {
            return null
        }

        return this.format(num);
    }

    format(number) {
        if (number == null || typeof number != 'number') {
            return number;
        }

        return (Math.round(number * 100) / 100).toLocaleString(this.locale);
    }
}