// Home — redirects to Unified Workspace
import { route } from '../core/router.js';
import { navigate as urlNavigate } from '../core/url.js';

route('#/', async () => {
  urlNavigate('/workspace');
});
