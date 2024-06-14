// index.js
import { runScraper } from './name+link_scraper.js';
import { addWebsites } from './website_adder.js';

async function main() {
    try {
        console.log("Starting the name and link scraper...");
        // await runScraper();
        console.log("temporarely not using it because already in json ");

        console.log("Starting to add website links...");
        await addWebsites();
        
        console.log("All tasks completed successfully!");
    } catch (error) {
        console.error("Error in running tasks", error);
    }
}

main();
