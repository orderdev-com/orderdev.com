
export const checkRequestOrigin = (origin: string) => {
    return origin.endsWith(process.env.ORIGIN!);
}