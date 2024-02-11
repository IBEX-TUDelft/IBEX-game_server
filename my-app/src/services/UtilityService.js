export function extractDataFromObject(object, ...tags) {
    if (tags.length === 0 || object == null) {
        return object;
    }

    let obj = object[tags[0]];

    if (tags.length >= 1) {
        for (let i = 1; i < tags.length; i++) {
            obj = obj[tags[i]];

            if (obj == null) {
                break;
            }
        }
    }

    return obj;
}

export function extractProperty (rounds, phase, property) {
    const result = [];

    rounds.forEach(r => {
        if (r.phase[phase] == null) {
            result.push(null);
            return
        }

        result.push(r.phase[phase][property]);
    })

    return result;
}