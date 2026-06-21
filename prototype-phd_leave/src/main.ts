import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app.component';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Agentation } from 'agentation';

bootstrapApplication(App, appConfig)
  .then(() => {
    // ── Agentation Integration ───────────────────────────────────────────────
    const agentationContainer = document.createElement('div');
    agentationContainer.id = 'agentation-root';
    document.body.appendChild(agentationContainer);

    const root = createRoot(agentationContainer);
    root.render(React.createElement(Agentation as any, {
      endpoint: "http://localhost:4747",
      onSessionCreated: (sessionId: string) => {
        console.log("Agentation session started:", sessionId);
      }
    }));
  })
  .catch((err) => console.error(err));
