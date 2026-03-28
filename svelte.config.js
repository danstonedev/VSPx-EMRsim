import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: true,
    }),
    // Azure SWA serves API from /api/* — keep paths clean
    paths: {
      base: '',
    },
  },
};

export default config;
