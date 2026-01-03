import fs from 'fs/promises';
import path from 'path';
import { getMeasurements } from './withings';

export interface MeasurementData {
    userid: string;
    year: number;
    month: number;
    fetchedAt: string;
    measurements: any;
}

export class WithingsDAO {
    private dataDir: string;

    constructor(dataDir: string = 'data') {
        this.dataDir = dataDir;
    }

    /**
     * Get the file path for a specific user and month
     */
    private getFilePath(userid: string, year: number, month: number): string {
        const monthStr = month.toString().padStart(2, '0');
        const filename = `${year}-${monthStr}.json`;
        return path.join(this.dataDir, userid, filename);
    }

    /**
     * Ensure the user directory exists
     */
    private async ensureUserDir(userid: string): Promise<void> {
        const userDir = path.join(this.dataDir, userid);
        await fs.mkdir(userDir, { recursive: true });
    }

    /**
     * Fetch and store measurements for a specific month
     */
    async fetchAndStore(
        accessToken: string,
        userid: string,
        year: number,
        month: number
    ): Promise<MeasurementData> {
        // Calculate start and end timestamps for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        const startTimestamp = Math.floor(startDate.getTime() / 1000);
        const endTimestamp = Math.floor(endDate.getTime() / 1000);

        console.log(`Fetching data for ${year}-${month.toString().padStart(2, '0')}...`);
        console.log(`  Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Fetch measurements from Withings API
        const measurements = await getMeasurements(accessToken, {
            startdate: startTimestamp,
            enddate: endTimestamp,
        });

        const data: MeasurementData = {
            userid,
            year,
            month,
            fetchedAt: new Date().toISOString(),
            measurements,
        };

        // Store to file
        await this.store(userid, year, month, data);

        return data;
    }

    /**
     * Store measurement data to file
     */
    async store(
        userid: string,
        year: number,
        month: number,
        data: MeasurementData
    ): Promise<void> {
        await this.ensureUserDir(userid);
        const filePath = this.getFilePath(userid, year, month);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`  ✓ Saved to ${filePath}`);
    }

    /**
     * Read measurement data from file
     */
    async read(
        userid: string,
        year: number,
        month: number
    ): Promise<MeasurementData | null> {
        try {
            const filePath = this.getFilePath(userid, year, month);
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    /**
     * Check if data exists for a specific month
     */
    async exists(userid: string, year: number, month: number): Promise<boolean> {
        try {
            const filePath = this.getFilePath(userid, year, month);
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * List all available months for a user
     */
    async listMonths(userid: string): Promise<Array<{ year: number; month: number }>> {
        try {
            const userDir = path.join(this.dataDir, userid);
            const files = await fs.readdir(userDir);
            
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const match = file.match(/^(\d{4})-(\d{2})\.json$/);
                    if (match) {
                        return {
                            year: parseInt(match[1], 10),
                            month: parseInt(match[2], 10),
                        };
                    }
                    return null;
                })
                .filter((item): item is { year: number; month: number } => item !== null)
                .sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year;
                    return a.month - b.month;
                });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    /**
     * Delete data for a specific month
     */
    async delete(userid: string, year: number, month: number): Promise<boolean> {
        try {
            const filePath = this.getFilePath(userid, year, month);
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get the last modified timestamp for a specific month's data file
     */
    async getLastModified(userid: string, year: number, month: number): Promise<Date | null> {
        try {
            const filePath = this.getFilePath(userid, year, month);
            const stats = await fs.stat(filePath);
            return stats.mtime;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
}
