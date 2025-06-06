import { auth } from '../auth';

export const isAuthenticated = async (c, next) => {
    try {
        // Use Better Auth's session API through the server handler
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (!session) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        c.set('userId', session.user.id);
        await next();
    } catch (error) {
        console.error('Authentication error:', error);
        return c.json({ error: 'Unauthorized' }, 401);
    }
};