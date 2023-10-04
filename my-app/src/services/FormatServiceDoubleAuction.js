const emptyValue = { value: '' };

export default class FormatService {
    locale;
    decimalSeparator;

    constructor(locale) {
        this.locale = locale;
        var _a, _b;
        const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
        this.decimalSeparator = parts.find((d) => d.type === 'decimal').value;
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

        if (typeof localizedString === 'number') {
            return localizedString;
        }

        if (typeof localizedString != 'string') {
            localizedString = localizedString.toString();
        }

        try {
            const numericString = localizedString
                .trim()
                .replace(this._group, '')
                .replace(this._decimal, '.')
                .replace(this._numeral, this._index);

                return parseFloat(numericString);
            //console.log(`Numeric String: ${numericString}, ${parseFloat(numericString)}`)
            //return numericString ? Number(numericString) : NaN;
        } catch (err) {
            console.error(`Could not turn ${typeof localizedString} "${localizedString}" into a numeric string`, err);
            return NaN;
        }
    }

    reformat(string) {
        if (typeof string != 'string') {
            string = string.toString().trim();
        }

        let appendDecimal= '';

        console.log(`Comparing ${string.charAt(string.length - 1)} with ${this.decimalSeparator}`);

        if (string.charAt(string.length - 1) === this.decimalSeparator) {
            appendDecimal = this.decimalSeparator;
        }

        const num = this.parse(string);

        console.log(`Received number; ${num}`);
        
        if (num == null || isNaN(num)) {
            return null
        }

        return this.format(num) + appendDecimal;
    }

    format(number) {
        if (number == null || typeof number === 'undefined') {
            return number;
        }

        if (typeof number === 'string') {
            return this.format(parseFloat(number));
        }

        if (typeof number != 'number') {
            return number;
        }

        return (Math.floor(number * 100) / 100).toLocaleString(this.locale);
    }
}