import { RequireAtLeastOne } from './type-pickers';

function createManyParams(list: any[]) {
  const result = list.reduce((accum: any[], item) => {
    if (typeof item === 'object') {
      if (item.id !== null && item.id !== undefined) {
        accum.push({ id: item.id });
      }
    } else if (typeof item === 'number' || typeof item === 'string') {
      accum.push({ id: item });
    }
    throw new Error(`Could not serialize item for 'id' paramater.`);
  }, []);

  if (result.length > 0) return result;
  else return undefined;
}

export function connectOne(
  item: RequireAtLeastOne<any, 'id'> | number | string | null | undefined
) {
  if (item !== undefined || item !== null) {
    if (typeof item === 'object' && item?.id !== null && item?.id !== undefined) {
      return {
        connect: { id: (item as any).id },
      };
    } else if (typeof item === 'number' || typeof item === 'string') {
      return {
        connect: { id: item },
      };
    }
  }

  return undefined;
}

export function connectMany(
  list:
    | Array<RequireAtLeastOne<any, 'id'> | null | undefined>
    | Array<number | null | undefined>
    | Array<string | null | undefined>
    | null
    | undefined
) {
  if (list) {
    const cleanedList = (list as any[]).filter(x => x !== null && x !== undefined);

    if (cleanedList.length > 0) {
      return { connect: createManyParams(cleanedList) };
    }
  }

  return undefined;
}

export function set(
  list:
    | Array<RequireAtLeastOne<any, 'id'> | null | undefined>
    | Array<number | null | undefined>
    | Array<string | null | undefined>
    | null
    | undefined
) {
  if (list) {
    const cleanedList = (list as any[]).filter(x => x !== null && x !== undefined);

    if (cleanedList.length > 0) {
      return { connect: createManyParams(cleanedList) };
    }
  }

  return undefined;
}

export function disconnectMany(
  list:
    | Array<RequireAtLeastOne<any, 'id'> | null | undefined>
    | Array<number | null | undefined>
    | Array<string | null | undefined>
    | null
    | undefined
) {
  if (list) {
    const cleanedList = (list as any[]).filter(x => x !== null && x !== undefined);

    if (cleanedList.length > 0) {
      return { connect: createManyParams(cleanedList) };
    }
  }

  return undefined;
}