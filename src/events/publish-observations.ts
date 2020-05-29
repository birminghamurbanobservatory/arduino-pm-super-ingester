import * as Promise from 'bluebird';
import * as event from 'event-stream';


export async function publishObservations(observations: any[]): Promise<void> {

  await Promise.mapSeries(observations, async (observation): Promise<void> => {
    await event.publish('observation.incoming', observation);
  });

  return;
}
