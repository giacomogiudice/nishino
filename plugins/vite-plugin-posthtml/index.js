import posthtml from 'posthtml';

export default ({ plugins = [] } = {}) => {
  const dependencies = new Set();

  return {
    name: 'vite-plugin-posthtml',
    async transformIndexHtml(html) {
      const processed = await posthtml(plugins).process(html);
      processed.messages &&
        processed.messages.forEach((msg) => {
          switch (msg.type) {
            case 'dependency':
              dependencies.add(msg.file);
              break;
            case 'error':
              console.error(msg.message);
              break;
            case 'warning':
              console.warn(msg.message);
          }
        });
      return processed.html;
    },
    handleHotUpdate({ server, file }) {
      if (dependencies.has(file)) {
        server.ws.send({
          type: 'full-reload'
        });

        return [];
      }
    }
  };
};
