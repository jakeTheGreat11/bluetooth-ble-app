export type BleProfileBase = {
    id: string,
    label: string,
    payload: number[]
}

export type ManufacturerProfile = BleProfileBase & {
    kind: 'manufacturer',
    companyId: number,
}

export type ServiceProfile = BleProfileBase & {
    kind: 'service',
    serviceId: number,
}

export type BleProfile = ManufacturerProfile | ServiceProfile;

/** Apple Continuity Proximity Pairing (type 0x07): length 0x19, pairing mode 0x01, then 2-byte model. */
function appleProximityPayload(modelHi: number, modelLo: number): number[] {
    return [
        0x07, 0x19, 0x01, modelHi, modelLo,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ];
}

export const BLE_PROFILES: BleProfile[] = [
    {
        id: 'samsung-buds',
        label: 'Samsung Buds',
        kind: 'manufacturer',
        companyId: 0x0075,
        payload: [0x42, 0x09, 0x81, 0x02, 0x14, 0x15, 0x03, 0x21, 0x01, 0x09, 0xAB, 0x0C, 0x01, 0x46, 0x06, 0x3C, 0xDD, 0x0A, 0x00, 0x00, 0x00, 0x00, 0xA7, 0x00]
    },
    {
        id: 'sony-xm5',
        label: 'Sony XM5',
        kind: 'service',
        serviceId: 0xFE2C,
        payload: [0xD4, 0x46, 0xA7]
    },
    {
        id: 'airpods-1',
        label: 'AirPods (1st gen)',
        kind: 'manufacturer',
        companyId: 0x004C,
        payload: appleProximityPayload(0x02, 0x20),
    },
    {
        id: 'airpods-2',
        label: 'AirPods (2nd gen)',
        kind: 'manufacturer',
        companyId: 0x004C,
        payload: appleProximityPayload(0x0F, 0x20),
    },
    {
        id: 'airpods-3',
        label: 'AirPods (3rd gen)',
        kind: 'manufacturer',
        companyId: 0x004C,
        payload: appleProximityPayload(0x13, 0x20),
    },
    {
        id: 'airpods-pro',
        label: 'AirPods Pro',
        kind: 'manufacturer',
        companyId: 0x004C,
        payload: appleProximityPayload(0x0E, 0x20),
    },
    {
        id: 'airpods-pro-2',
        label: 'AirPods Pro (2nd gen)',
        kind: 'manufacturer',
        companyId: 0x004C,
        payload: appleProximityPayload(0x14, 0x20),
    },
    {
        id: 'airpods-max',
        label: 'AirPods Max',
        kind: 'manufacturer',
        companyId: 0x004C,
        payload: appleProximityPayload(0x0A, 0x20),
    },
    {
        id: 'beats-studio-buds',
        label: 'Beats Studio Buds',
        kind: 'manufacturer',
        companyId: 0x004C,
        payload: appleProximityPayload(0x11, 0x20),
    },
    {
        id: 'beats-fit-pro',
        label: 'Beats Fit Pro',
        kind: 'manufacturer',
        companyId: 0x004C,
        payload: appleProximityPayload(0x12, 0x20),
    },
]
