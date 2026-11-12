import * as csv from 'csv-parser';
import { Readable, Stream } from 'stream';

/**
 * Parse a CSV stream with csv-parser, invoking a row callback for each row.
 * The returned promise resolves with all non-null row callback results once the stream is closed
 * and every row callback has settled. It rejects on the first error, either a stream error or a
 * row callback rejection.
 * @param s Stream containing the CSV content
 * @param options csv-parser options
 * @param rowCallback Callback invoked for each parsed row
 * @returns Promise resolving with the non-null row callback results
 */
export function parseCsvStream<T>(
    s: Stream,
    options: csv.Options,
    rowCallback: (row: any) => T | Promise<T>,
): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const results: T[] = [];
        const rowPromises: Array<Promise<void>> = [];
        let rejected = false;

        const fail = (err: any) => {
            if (!rejected) {
                rejected = true;
                reject(err);
            }
        };

        const finish = () => {
            if (rejected) {
                return;
            }
            Promise.all(rowPromises)
                .then(() => {
                    if (!rejected) {
                        resolve(results);
                    }
                })
                .catch(fail);
        };

        const stream = s
            .pipe(csv(options))
            .on('data', (row: any) => {
                const promise = Promise.resolve()
                    .then(() => rowCallback(row))
                    .then((value) => {
                        if (value !== null && value !== undefined) {
                            results.push(value);
                        }
                    })
                    .catch(fail);
                rowPromises.push(promise);
            })
            .on('error', (err) => {
                fail(err);
            })
            .on('end', () => {
                stream.destroy();
            })
            .on('close', () => {
                finish();
            });

        s.on('error', (err) => {
            fail(err);
        });
    });
}

/**
 * Parse CSV content with csv-parser, invoking a row callback for each row.
 * See {@link parseCsvStream} for the resolution semantics.
 * @param content CSV content
 * @param options csv-parser options
 * @param rowCallback Callback invoked for each parsed row
 * @returns Promise resolving with the non-null row callback results
 */
export function parseCsvContent<T>(
    content: string,
    options: csv.Options,
    rowCallback: (row: any) => T | Promise<T>,
): Promise<T[]> {
    const s = new Readable();
    s.push(content);
    s.push(null);
    return parseCsvStream(s, options, rowCallback);
}
