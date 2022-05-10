export const notNullString = (value) => `${value}` ?? '';
export const formatAsNumber = (value) => (!isNaN(value) ? Number(value) : undefined);