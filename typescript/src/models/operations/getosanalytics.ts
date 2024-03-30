/*
 * Code generated by Speakeasy (https://speakeasyapi.dev). DO NOT EDIT.
 */

import * as components from "../components";
import * as z from "zod";

/**
 * The interval to retrieve analytics for.
 */
export enum GetOSAnalyticsQueryParamInterval {
    Oneh = "1h",
    TwentyFourh = "24h",
    Sevend = "7d",
    Thirtyd = "30d",
    Ninetyd = "90d",
    All = "all",
}

/**
 * The country to retrieve analytics for.
 */
export enum GetOSAnalyticsQueryParamCountry {
    Af = "AF",
    Al = "AL",
    Dz = "DZ",
    As = "AS",
    Ad = "AD",
    Ao = "AO",
    Ai = "AI",
    Aq = "AQ",
    Ag = "AG",
    Ar = "AR",
    Am = "AM",
    Aw = "AW",
    Au = "AU",
    At = "AT",
    Az = "AZ",
    Bs = "BS",
    Bh = "BH",
    Bd = "BD",
    Bb = "BB",
    By = "BY",
    Be = "BE",
    Bz = "BZ",
    Bj = "BJ",
    Bm = "BM",
    Bt = "BT",
    Bo = "BO",
    Ba = "BA",
    Bw = "BW",
    Bv = "BV",
    Br = "BR",
    Io = "IO",
    Bn = "BN",
    Bg = "BG",
    Bf = "BF",
    Bi = "BI",
    Kh = "KH",
    Cm = "CM",
    Ca = "CA",
    Cv = "CV",
    Ky = "KY",
    Cf = "CF",
    Td = "TD",
    Cl = "CL",
    Cn = "CN",
    Cx = "CX",
    Cc = "CC",
    Co = "CO",
    Km = "KM",
    Cg = "CG",
    Cd = "CD",
    Ck = "CK",
    Cr = "CR",
    Ci = "CI",
    Hr = "HR",
    Cu = "CU",
    Cy = "CY",
    Cz = "CZ",
    Dk = "DK",
    Dj = "DJ",
    Dm = "DM",
    Do = "DO",
    Ec = "EC",
    Eg = "EG",
    Sv = "SV",
    Gq = "GQ",
    Er = "ER",
    Ee = "EE",
    Et = "ET",
    Fk = "FK",
    Fo = "FO",
    Fj = "FJ",
    Fi = "FI",
    Fr = "FR",
    Gf = "GF",
    Pf = "PF",
    Tf = "TF",
    Ga = "GA",
    Gm = "GM",
    Ge = "GE",
    De = "DE",
    Gh = "GH",
    Gi = "GI",
    Gr = "GR",
    Gl = "GL",
    Gd = "GD",
    Gp = "GP",
    Gu = "GU",
    Gt = "GT",
    Gn = "GN",
    Gw = "GW",
    Gy = "GY",
    Ht = "HT",
    Hm = "HM",
    Va = "VA",
    Hn = "HN",
    Hk = "HK",
    Hu = "HU",
    Is = "IS",
    In = "IN",
    Id = "ID",
    Ir = "IR",
    Iq = "IQ",
    Ie = "IE",
    Il = "IL",
    It = "IT",
    Jm = "JM",
    Jp = "JP",
    Jo = "JO",
    Kz = "KZ",
    Ke = "KE",
    Ki = "KI",
    Kp = "KP",
    Kr = "KR",
    Kw = "KW",
    Kg = "KG",
    La = "LA",
    Lv = "LV",
    Lb = "LB",
    Ls = "LS",
    Lr = "LR",
    Ly = "LY",
    Li = "LI",
    Lt = "LT",
    Lu = "LU",
    Mo = "MO",
    Mg = "MG",
    Mw = "MW",
    My = "MY",
    Mv = "MV",
    Ml = "ML",
    Mt = "MT",
    Mh = "MH",
    Mq = "MQ",
    Mr = "MR",
    Mu = "MU",
    Yt = "YT",
    Mx = "MX",
    Fm = "FM",
    Md = "MD",
    Mc = "MC",
    Mn = "MN",
    Ms = "MS",
    Ma = "MA",
    Mz = "MZ",
    Mm = "MM",
    Na = "NA",
    Nr = "NR",
    Np = "NP",
    Nl = "NL",
    Nc = "NC",
    Nz = "NZ",
    Ni = "NI",
    Ne = "NE",
    Ng = "NG",
    Nu = "NU",
    Nf = "NF",
    Mk = "MK",
    Mp = "MP",
    No = "NO",
    Om = "OM",
    Pk = "PK",
    Pw = "PW",
    Ps = "PS",
    Pa = "PA",
    Pg = "PG",
    Py = "PY",
    Pe = "PE",
    Ph = "PH",
    Pn = "PN",
    Pl = "PL",
    Pt = "PT",
    Pr = "PR",
    Qa = "QA",
    Re = "RE",
    Ro = "RO",
    Ru = "RU",
    Rw = "RW",
    Sh = "SH",
    Kn = "KN",
    Lc = "LC",
    Pm = "PM",
    Vc = "VC",
    Ws = "WS",
    Sm = "SM",
    St = "ST",
    Sa = "SA",
    Sn = "SN",
    Sc = "SC",
    Sl = "SL",
    Sg = "SG",
    Sk = "SK",
    Si = "SI",
    Sb = "SB",
    So = "SO",
    Za = "ZA",
    Gs = "GS",
    Es = "ES",
    Lk = "LK",
    Sd = "SD",
    Sr = "SR",
    Sj = "SJ",
    Sz = "SZ",
    Se = "SE",
    Ch = "CH",
    Sy = "SY",
    Tw = "TW",
    Tj = "TJ",
    Tz = "TZ",
    Th = "TH",
    Tl = "TL",
    Tg = "TG",
    Tk = "TK",
    To = "TO",
    Tt = "TT",
    Tn = "TN",
    Tr = "TR",
    Tm = "TM",
    Tc = "TC",
    Tv = "TV",
    Ug = "UG",
    Ua = "UA",
    Ae = "AE",
    Gb = "GB",
    Us = "US",
    Um = "UM",
    Uy = "UY",
    Uz = "UZ",
    Vu = "VU",
    Ve = "VE",
    Vn = "VN",
    Vg = "VG",
    Vi = "VI",
    Wf = "WF",
    Eh = "EH",
    Ye = "YE",
    Zm = "ZM",
    Zw = "ZW",
    Ax = "AX",
    Bq = "BQ",
    Cw = "CW",
    Gg = "GG",
    Im = "IM",
    Je = "JE",
    Me = "ME",
    Bl = "BL",
    Mf = "MF",
    Rs = "RS",
    Sx = "SX",
    Ss = "SS",
    Xk = "XK",
}

export type GetOSAnalyticsRequest = {
    /**
     * The ID of the workspace the link belongs to.
     */
    workspaceId: string;
    /**
     * The domain of the short link.
     */
    domain?: string | undefined;
    /**
     * The short link slug.
     */
    key?: string | undefined;
    /**
     * The interval to retrieve analytics for.
     */
    interval?: GetOSAnalyticsQueryParamInterval | undefined;
    /**
     * The country to retrieve analytics for.
     */
    country?: GetOSAnalyticsQueryParamCountry | undefined;
    /**
     * The city to retrieve analytics for.
     */
    city?: string | undefined;
    /**
     * The device to retrieve analytics for.
     */
    device?: string | undefined;
    /**
     * The browser to retrieve analytics for.
     */
    browser?: string | undefined;
    /**
     * The OS to retrieve analytics for.
     */
    os?: string | undefined;
    /**
     * The referer to retrieve analytics for.
     */
    referer?: string | undefined;
    /**
     * The URL to retrieve analytics for.
     */
    url?: string | undefined;
    /**
     * Whether to exclude the root link from the response.
     */
    excludeRoot?: boolean | undefined;
    /**
     * The tag ID to retrieve analytics for.
     */
    tagId?: string | undefined;
};

export type GetOSAnalyticsResponseBody = {
    /**
     * The name of the OS
     */
    os: string;
    /**
     * The number of clicks from this OS
     */
    clicks: number;
};

export type GetOSAnalyticsResponse = {
    httpMeta: components.HTTPMetadata;
    /**
     * The top OS by number of clicks
     */
    responseBodies?: Array<GetOSAnalyticsResponseBody> | undefined;
};

/** @internal */
export const GetOSAnalyticsQueryParamInterval$ = z.nativeEnum(GetOSAnalyticsQueryParamInterval);

/** @internal */
export const GetOSAnalyticsQueryParamCountry$ = z.nativeEnum(GetOSAnalyticsQueryParamCountry);

/** @internal */
export namespace GetOSAnalyticsRequest$ {
    export type Inbound = {
        workspaceId: string;
        domain?: string | undefined;
        key?: string | undefined;
        interval?: GetOSAnalyticsQueryParamInterval | undefined;
        country?: GetOSAnalyticsQueryParamCountry | undefined;
        city?: string | undefined;
        device?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
        referer?: string | undefined;
        url?: string | undefined;
        excludeRoot?: boolean | undefined;
        tagId?: string | undefined;
    };

    export const inboundSchema: z.ZodType<GetOSAnalyticsRequest, z.ZodTypeDef, Inbound> = z
        .object({
            workspaceId: z.string(),
            domain: z.string().optional(),
            key: z.string().optional(),
            interval: GetOSAnalyticsQueryParamInterval$.optional(),
            country: GetOSAnalyticsQueryParamCountry$.optional(),
            city: z.string().optional(),
            device: z.string().optional(),
            browser: z.string().optional(),
            os: z.string().optional(),
            referer: z.string().optional(),
            url: z.string().optional(),
            excludeRoot: z.boolean().optional(),
            tagId: z.string().optional(),
        })
        .transform((v) => {
            return {
                workspaceId: v.workspaceId,
                ...(v.domain === undefined ? null : { domain: v.domain }),
                ...(v.key === undefined ? null : { key: v.key }),
                ...(v.interval === undefined ? null : { interval: v.interval }),
                ...(v.country === undefined ? null : { country: v.country }),
                ...(v.city === undefined ? null : { city: v.city }),
                ...(v.device === undefined ? null : { device: v.device }),
                ...(v.browser === undefined ? null : { browser: v.browser }),
                ...(v.os === undefined ? null : { os: v.os }),
                ...(v.referer === undefined ? null : { referer: v.referer }),
                ...(v.url === undefined ? null : { url: v.url }),
                ...(v.excludeRoot === undefined ? null : { excludeRoot: v.excludeRoot }),
                ...(v.tagId === undefined ? null : { tagId: v.tagId }),
            };
        });

    export type Outbound = {
        workspaceId: string;
        domain?: string | undefined;
        key?: string | undefined;
        interval?: GetOSAnalyticsQueryParamInterval | undefined;
        country?: GetOSAnalyticsQueryParamCountry | undefined;
        city?: string | undefined;
        device?: string | undefined;
        browser?: string | undefined;
        os?: string | undefined;
        referer?: string | undefined;
        url?: string | undefined;
        excludeRoot?: boolean | undefined;
        tagId?: string | undefined;
    };

    export const outboundSchema: z.ZodType<Outbound, z.ZodTypeDef, GetOSAnalyticsRequest> = z
        .object({
            workspaceId: z.string(),
            domain: z.string().optional(),
            key: z.string().optional(),
            interval: GetOSAnalyticsQueryParamInterval$.optional(),
            country: GetOSAnalyticsQueryParamCountry$.optional(),
            city: z.string().optional(),
            device: z.string().optional(),
            browser: z.string().optional(),
            os: z.string().optional(),
            referer: z.string().optional(),
            url: z.string().optional(),
            excludeRoot: z.boolean().optional(),
            tagId: z.string().optional(),
        })
        .transform((v) => {
            return {
                workspaceId: v.workspaceId,
                ...(v.domain === undefined ? null : { domain: v.domain }),
                ...(v.key === undefined ? null : { key: v.key }),
                ...(v.interval === undefined ? null : { interval: v.interval }),
                ...(v.country === undefined ? null : { country: v.country }),
                ...(v.city === undefined ? null : { city: v.city }),
                ...(v.device === undefined ? null : { device: v.device }),
                ...(v.browser === undefined ? null : { browser: v.browser }),
                ...(v.os === undefined ? null : { os: v.os }),
                ...(v.referer === undefined ? null : { referer: v.referer }),
                ...(v.url === undefined ? null : { url: v.url }),
                ...(v.excludeRoot === undefined ? null : { excludeRoot: v.excludeRoot }),
                ...(v.tagId === undefined ? null : { tagId: v.tagId }),
            };
        });
}

/** @internal */
export namespace GetOSAnalyticsResponseBody$ {
    export type Inbound = {
        os: string;
        clicks: number;
    };

    export const inboundSchema: z.ZodType<GetOSAnalyticsResponseBody, z.ZodTypeDef, Inbound> = z
        .object({
            os: z.string(),
            clicks: z.number(),
        })
        .transform((v) => {
            return {
                os: v.os,
                clicks: v.clicks,
            };
        });

    export type Outbound = {
        os: string;
        clicks: number;
    };

    export const outboundSchema: z.ZodType<Outbound, z.ZodTypeDef, GetOSAnalyticsResponseBody> = z
        .object({
            os: z.string(),
            clicks: z.number(),
        })
        .transform((v) => {
            return {
                os: v.os,
                clicks: v.clicks,
            };
        });
}

/** @internal */
export namespace GetOSAnalyticsResponse$ {
    export type Inbound = {
        HttpMeta: components.HTTPMetadata$.Inbound;
        responseBodies?: Array<GetOSAnalyticsResponseBody$.Inbound> | undefined;
    };

    export const inboundSchema: z.ZodType<GetOSAnalyticsResponse, z.ZodTypeDef, Inbound> = z
        .object({
            HttpMeta: components.HTTPMetadata$.inboundSchema,
            responseBodies: z
                .array(z.lazy(() => GetOSAnalyticsResponseBody$.inboundSchema))
                .optional(),
        })
        .transform((v) => {
            return {
                httpMeta: v.HttpMeta,
                ...(v.responseBodies === undefined ? null : { responseBodies: v.responseBodies }),
            };
        });

    export type Outbound = {
        HttpMeta: components.HTTPMetadata$.Outbound;
        responseBodies?: Array<GetOSAnalyticsResponseBody$.Outbound> | undefined;
    };

    export const outboundSchema: z.ZodType<Outbound, z.ZodTypeDef, GetOSAnalyticsResponse> = z
        .object({
            httpMeta: components.HTTPMetadata$.outboundSchema,
            responseBodies: z
                .array(z.lazy(() => GetOSAnalyticsResponseBody$.outboundSchema))
                .optional(),
        })
        .transform((v) => {
            return {
                HttpMeta: v.httpMeta,
                ...(v.responseBodies === undefined ? null : { responseBodies: v.responseBodies }),
            };
        });
}
