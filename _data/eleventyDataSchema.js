import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

export default function(data) {
    const result = z.object({
        draft: z.boolean().optional(),
    }).safeParse(data);

    if(result.error) {
        throw fromZodError(result.error);
    }
};