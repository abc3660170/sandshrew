export type FrontType = "npmjs" | "pelipper";

export type NpmjsConfig = {
    tmp: string;
    fronttype: "npmjs";
    app: {
        port: number;
    };
    npmjs: {
        port: number;
        mirrorPath: string;
        remote: string;
        mirror: string;
    };
    mirror: string[];
};

export type PelipperConfig = {
    tmp: string;
    fronttype: "pelipper";
    app: {
        port: number;
    };
    pelipper: {
        port: number;
        remote: string;
        storage: string;
        mirrorPath: string;
        mirrorStorage: string;
    };
    mirror: Record<string, string>;
};

type DokcerWrap<T, U> = {
    docker :{
        mode: U extends "dockerhub" ? "dockerhub" : "harbor";
        options: T;
    }
}

export type UnknowRegistryConfig = (NpmjsConfig & DokcerWrap<DockerhubOptions, 'dockerhub'>) | (PelipperConfig &  DokcerWrap<HarborOptions, 'harbor'>);

export type RegistryConfig<T extends FrontType> = T extends "npmjs"
    ? NpmjsConfig
    : T extends "pelipper"
    ? PelipperConfig
    : never;

export enum Architecture {
    i386 = "386",
    amd64 = "amd64",
    arm = "arm",
    arm64 = "arm64",
    mips = "mips",
    mips64 = "mips64",
    mips64le = "mips64le",
    mipsle = "mipsle",
    ppc64 = "ppc64",
    ppc64le = "ppc64le",
    s390x = "s390x",
    wasm = "wasm",
    unknown = "unknown",
}

export enum OS {
    aix = "aix",
    android = "android",
    darwin = "darwin",
    dragonfly = "dragonfly",
    freebsd = "freebsd",
    illumos = "illumos",
    js = "js",
    linux = "linux",
    netbsd = "netbsd",
    openbsd = "openbsd",
    plan9 = "plan9",
    solaris = "solaris",
    windows = "windows",
}

export type Platform = `${OS}/${Architecture}`;

export type DockerHubAPIRepo = {
    name: string;
    id: string;
    star_count: number;
    pull_count: string;
    type?: "image" | "unrecognized";
    publisher?: {
        id: string;
        name: string;
    };
    badge?: "verified_publisher" | "official" | "none" | "sponsor";
    architectures?: Array<Architecture>;
    operating_systems?: Array<OS>;
};

export type FetchRepo = {
    total: number;
    results: DockerHubAPIRepo[];
};

export type DockerImageInfo = {
    architecture: Architecture;
    os: OS;
    os_version: string | null;
    status: "active" | "inactive";
    last_pulled: string;
    last_pushed: string;
    size: number;
    digest: string;
    variant: string | null;
};

export type DockerHubAPIVersion = {
    name: string;
    content_type: "image";
    full_size: number;
    id: number;
    repository: number;
    digest?: string;
    tag_status: "active" | "inactive";
    images: DockerImageInfo[];
};

export type FetchRepoTags = {
    count: number;
    next: string | null;
    previous: string | null;
    results: DockerHubAPIVersion[];
};

export type RepoMetaData = {
    id: string;
    name: string;
    tag: string;
    imageId: string;
    digest: string;
    localExsit: boolean;
    platform: Platform;
    tarFile?: string;
};

export type HarborTagInfo = {
    id: number;
    pull_time: string;
    push_time: string;
    digest: string;
    references: {
        child_digest: string;
        child_id: number;
        parent_id: number;
        platform: {
            os: OS;
            architecture: Architecture;
            variant: string | null;
        };
    }[] | null;
    extra_attrs: {
        os: OS;
        architecture: Architecture;
        os_version: string | null;
        status: "active" | "inactive";
        last_pulled: string;
        last_pushed: string;
        size: number;
        variant: string | null;
    } | null;
    size: number;
    tags: {
        artifact_id: number;
        id: number;
        name: string;
        pull_time: string;
        push_time: string;
    };
    type: "IMAGE";
};

export type RepoMetaGroup = {
    repos: RepoMetaData[];
};

export interface IDockerManager {
    getImageDocument: (
        id: string,
        tag: string,
        platform: Platform
    ) => Promise<DockerImageInfo | null>;
    getPackageDocument: (
        id: string,
        tag: string
    ) => Promise<DockerHubAPIVersion | null>;
    getVersions: (
        id: string,
        operate?: string
    ) => Promise<{ name: string; tags: string[] }>;
    getSuggestions: (keyword: string) => Promise<DockerHubAPIRepo[]>;
    pull: (
        repoName: string,
        tag: string,
        platform: Platform
    ) => Promise<RepoMetaData>;
    downloadTar: (repos: { id: string; tag: string; platform: Platform }[]) => Promise<string>;
    uploadTar: (file: string) => Promise<void>;
    getUploadDir: () => string;
}

export type DockerhubOptions = {
    uplink: {
        url: string;
        imageUrl: string;
    };
    registerAPI: string;
    tmp: string;
}

export type HarborOptions = {
    uplink: {
        url: string;
        username: string;
        password: string;
        imageUrl: string;
    };
    harbor: {
        url: string;
        username: string;
        password: string;
        imageUrl: string;
    };
    tmp: string;
} 
