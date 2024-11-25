import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseService } from "@spt/services/DatabaseService";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import * as fs from "node:fs";
import * as path from "node:path";

class SimpleWorkoutQTE implements IPostDBLoadMod
{
    private mod: string
    private logger: ILogger
    private static config: Config;
    private static configPath = path.resolve(__dirname, "../config/config.json");

    constructor() 
    {
        this.mod = "acidphantasm-SimpleWorkoutQTE"; // Set name of mod so we can log it to console later
    }

    public postDBLoad(container: DependencyContainer): void 
    {
        // Stuff we're going to use
        SimpleWorkoutQTE.config = JSON.parse(fs.readFileSync(SimpleWorkoutQTE.configPath, "utf-8"));
        const databaseService: DatabaseService = container.resolve<DatabaseService>("DatabaseService");
        this.logger = container.resolve<ILogger>("WinstonLogger");

        const tables: IDatabaseTables = databaseService.getTables();
        const hideoutTable = tables.hideout;
        const quickTimeEvents = hideoutTable.qte[0].quickTimeEvents;
        const results = hideoutTable.qte[0].results;

        if (SimpleWorkoutQTE.config.easyMode)
        {
            for (const quickTimeEvent of quickTimeEvents)
            {
                quickTimeEvent.speed = 0.5;
                quickTimeEvent.successRange.x = 0;
                quickTimeEvent.successRange.y = 0.75;
            }
        }
        else 
        {
            const quickTimeEvents = hideoutTable.qte[0].quickTimeEvents;
            for (const quickTimeEvent of quickTimeEvents)
            {
                quickTimeEvent.speed = quickTimeEvent.speed * SimpleWorkoutQTE.config.qteSpeed;
                quickTimeEvent.successRange.y = quickTimeEvent.successRange.y * SimpleWorkoutQTE.config.qteSize;
                if (quickTimeEvent.successRange.y <= 0.07 && SimpleWorkoutQTE.config.preventVeryDifficultQTE)
                {
                    quickTimeEvent.successRange.y = 0.07;
                }
                if (quickTimeEvent.successRange.y >= 1)
                {                   
                    quickTimeEvent.successRange.y = 1;
                }
                if (SimpleWorkoutQTE.config.debugLogging){this.logger.log(`[${this.mod}] QTE Speed: ${quickTimeEvent.speed.toFixed(2)} || SizeX: ${quickTimeEvent.successRange.x.toFixed(2)} || SizeY: ${quickTimeEvent.successRange.y.toFixed(2)}`,"cyan");}
            }
        }

        results.singleSuccessEffect.rewardsRange[0].levelMultipliers = [
            {
                "level": 0,
                "multiplier": 6
            },
            {
                "level": 10,
                "multiplier": 8
            },
            {
                "level": 25,
                "multiplier": 10
            }
        ]
        results.singleSuccessEffect.rewardsRange[1].levelMultipliers = [  
            {
                "level": 0,
                "multiplier": 6
            },
            {
                "level": 10,
                "multiplier": 8
            },
            {
                "level": 25,
                "multiplier": 10
            }
        ]

        results.finishEffect.rewardsRange[0].time = SimpleWorkoutQTE.config.musclePainTime
    }
}

interface Config 
{
    musclePainTime: number,
    easyMode: boolean,
    qteSpeed: number,
    qteSize: number,
    preventVeryDifficultQTE: boolean,
    debugLogging: boolean,
}

module.exports = { mod: new SimpleWorkoutQTE() }