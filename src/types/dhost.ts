export interface RawDHostEntry {
    /**
     * Port index (0-based or 1-based, depends on device, typically index into port array)
     * hex string or number
     */
    prt: string | number; // "0x0" etc or number
    /**
     * MAC address
     */
    adr: string;
    /**
     * VLAN ID
     */
    vid: number | string;
}

export interface DHostEntry {
    port: number;
    mac: string;
    vlanId: number;
}
