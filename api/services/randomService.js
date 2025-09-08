function boxMullerTransform() {
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    
    return { z0, z1 };
}

function getNormallyDistributedRandomNumber(mean, stddev) {
    const { z0, _ } = boxMullerTransform();
    
    return z0 * stddev + mean;
}

function getLinearlyDistributedNumber(min, max) {
    if (typeof min != 'number') {
        throw new Error(`Min must be a number. It was ${min} (${typeof min})`);
    }

    if (typeof max != 'number') {
        throw new Error(`Min must be a number. It was ${max} (${typeof max})`);
    }

    if (min >= max) {
        throw new Error(`Max must be greater than min but ${max} (max) < ${min} (min)`);
    }

    return min + Math.random() * ( max - min );
}

/**
 * 
 * @param {number} min 
 * @param {number} max 
 * @param {Object} dataSource 
 * @param {string} tag 
 * @returns 
 */
function getLinearWithDataSource(min, max, dataSource, tag) {
    if (dataSource != null) {
        return dataSource[tag];
    }

    return getLinearlyDistributedNumber(min, max);
}

function getNormalWithDataSource(mean, stddev, dataSource, tag) {
    if (dataSource != null) {
        return dataSource[tag];
    }

    return getNormallyDistributedRandomNumber(mean, stddev);
}

export default {
    getNormallyDistributedRandomNumber,
    getLinearlyDistributedNumber,
    getLinearWithDataSource,
    getNormalWithDataSource
}
