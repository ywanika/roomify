const PROJECT_PREFIX = 'roomify_project_';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
};

const jsonResponse = (data, status = 200) => (
    new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        }
    })
);

const jsonError = (status, message, extra = {}) => jsonResponse({error: message, ...extra}, status);

const getUserId = async (userPuter) => {
    try{
        const user = await userPuter.auth.getUser();

        return user?.uuid || null;
    } catch {
        return null;
    }
}

router.options('/api/projects/save', () => new Response(null, { headers: corsHeaders }));
router.options('/api/projects/list', () => new Response(null, { headers: corsHeaders }));
router.options('/api/projects/get', () => new Response(null, { headers: corsHeaders }));

router.post('/api/projects/save', async ({request, user}) =>{
    try{
        const userPuter = user.puter

        if (!userPuter) {
            return jsonError(401, 'Unauthorized')
        }

        const body = await request.json();
        const project = body?.project;

        if (!project?.id || !project?.sourceImage) return jsonError(400, 'Invalid project data');

        const payload = {
            ...project,
            updatedAt: new Date().toISOString(),
        }

        const userID = await getUserId(userPuter);
        if(!userID) return jsonError(401, 'Unauthorized');

        const key = `${PROJECT_PREFIX}${project.id}`;
        await userPuter.kv.set(key, payload);

        return jsonResponse({saved: true, id: project.id, project:payload})
    } catch (e) {
        return jsonError(500, 'Failed to save project', {message: e.message || 'unknown error'})
    }
})

router.get('/api/projects/list', async ({request, user}) => {
    try {
        const userPuter = user.puter

        if (!userPuter) {
            return jsonError(401, 'Unauthorized')
        }

        const userID = await getUserId(userPuter);
        if(!userID) return jsonError(401, 'Unauthorized');

        const projects = ( await userPuter.kv.list(PROJECT_PREFIX, true) )
            .map( ({value}) => ({...value, isPublic:true}) )

        return jsonResponse({ projects });
    } catch (e) {
        return jsonError(500, 'Failed to list projects', {message: e.message || 'unknown error'})
    }
})

router.get('/api/projects/get', async ({request, user}) => {
    try {
        const userPuter = user.puter
        if (!userPuter) {
            return jsonError(401, 'Unauthorized')
        }

        const userID = await getUserId(userPuter);
        if(!userID) return jsonError(401, 'Unauthorized');

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return jsonError(400, 'Missing project id');

        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);

        if (!project) return jsonError(404, 'Project not found');

        return jsonResponse({ project });
    } catch (e) {
        return jsonError(500, 'Failed to get project', {message: e.message || 'unknown error'})
    }
})

