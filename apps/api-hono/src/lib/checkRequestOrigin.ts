
export const checkRequestOrigin = async (origin: string) => {
    // TODO: check site domain names and maybe ping domains to validate IP address.
    return Promise.resolve(origin.endsWith(process.env.ORIGIN!));
}