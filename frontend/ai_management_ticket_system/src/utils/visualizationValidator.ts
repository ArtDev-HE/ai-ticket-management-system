import { VisualizationRegistry } from '@/config/VisualizationRegistry';

/**
 * Validate that `data` contains the required fields for the given visualization key.
 * Supports array-of-objects or single object shapes.
 */
export function validateVisualizationData(key: string, data: any): { valid: boolean; missing?: string[] } {
    const template = VisualizationRegistry[key];
    if (!template) return { valid: false, missing: ['visualization_key_not_found'] };

    const required = template.requiredFields || [];
    if (!required.length) return { valid: true };

    const checkFields = (obj: any) => required.filter((field) => !(obj && Object.prototype.hasOwnProperty.call(obj, field)));

    if (Array.isArray(data)) {
        if (data.length === 0) return { valid: false, missing: required };
        const missing = new Set<string>();
        // check first few items
        for (let i = 0; i < Math.min(5, data.length); i++) {
            const m = checkFields(data[i]);
            m.forEach((f) => missing.add(f));
        }
        return { valid: missing.size === 0, missing: Array.from(missing) };
    }

    // single object
    const missing = checkFields(data);
    return { valid: missing.length === 0, missing: missing.length ? missing : undefined };
}

export default validateVisualizationData;
