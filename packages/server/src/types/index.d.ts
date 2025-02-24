export type FrontType = 'npmjs' | 'pelipper'


export type NpmjsConfig = {
    tmp: string,
    fronttype: 'npmjs'
    app: {
        port: number
    },
    npmjs: {
        port: number,
        mirrorPath: string,
        remote: string,
        mirror: string
    }
}

export type PelipperConfig = {
    tmp: string,
    fronttype: 'pelipper',
    app: {
        port: number
    },
    pelipper: {
        port: number,
        remote: string,
        storage: string,
        mirrorPath: string,
        mirrorStorage: string
    }
}

export type UnknowRegistryConfig = NpmjsConfig | PelipperConfig;

export type RegistryConfig<T extends FrontType> = T extends 'npmjs' ? NpmjsConfig:  T extends 'pelipper'  ? PelipperConfig : never;