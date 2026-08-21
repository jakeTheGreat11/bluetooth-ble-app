import { BleProfile, BLE_PROFILES} from "./profiles";

type ADStructure = {type: number, value: number[]}
const AD_TYPE_MANUFACTURER_DATA = 0xFF;
const AD_TYPE_SERVICE_DATA = 0x16;

function parseAdStructures(bytes: number[]): ADStructure[] {
    const results: ADStructure[] = [];
    let offset = 0;

    while (offset < bytes.length) {
        const length = bytes[offset];
        if (length === 0) break;

        const type = bytes[offset + 1];
        const value = bytes.slice(offset + 2, offset + length + 1)

        results.push({type, value})
        offset += length + 1;
    }
    return results;
}

export function decodeProfile(bytes: number[]): BleProfile | undefined {
    const structures = parseAdStructures(bytes);

    for (const structure of structures) {
        if (structure.type === AD_TYPE_MANUFACTURER_DATA) {
            const companyId = structure.value[0] + structure.value[1] * 256;
            const payload = structure.value.slice(2);

            // Apple Continuity Nearby Action: match action byte
            if (companyId === 0x004c && payload[0] === 0x0f) {
                const action = payload[3];
                const nearby = BLE_PROFILES.find(
                    (p) =>
                        p.kind === 'manufacturer' &&
                        p.advertiseMode === 'continuity-nearby-action' &&
                        p.actionByte === action
                );
                if (nearby) return nearby;
            }

            // Samsung Easy Setup: match full static payload when possible
            if (companyId === 0x0075) {
                const samsung = BLE_PROFILES.find(
                    (p) =>
                        p.kind === 'manufacturer' &&
                        p.companyId === 0x0075 &&
                        p.payload.length === payload.length &&
                        p.payload.every((b, i) => b === payload[i])
                );
                if (samsung) return samsung;
            }

            const profile = BLE_PROFILES.find(
                (p) => p.kind === 'manufacturer' && p.companyId === companyId
            );
            if (profile) return profile;
        } else if (structure.type === AD_TYPE_SERVICE_DATA) {
            const serviceId = structure.value[0] + structure.value[1] * 256;
            const profile = BLE_PROFILES.find(
                (p) => p.kind === 'service' && p.serviceId === serviceId
            );
            if (profile) return profile;
        }
    }
    return undefined;
}