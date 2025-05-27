import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import md5 from "md5";

const cacheDir = "cache";
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

const getCachedPage = (urlHash) => {
    const filePath = `${cacheDir}/${urlHash}.html`;
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf8");
    }
    return null;
};

const saveToCache = (urlHash, content) => {
    const filePath = `${cacheDir}/${urlHash}.html`;
    fs.writeFileSync(filePath, content, "utf8");
};

async function scrapeComics() {
    let currentUrl = "https://www.smbc-comics.com/";
    const maxPages = 10;

    for (let i = 0; i < maxPages; i++) {
        try {
            const urlHash = md5(currentUrl);
            let htmlContent = getCachedPage(urlHash);

            if (!htmlContent) {
                console.log(currentUrl);
                const response = await axios.get(currentUrl);
                htmlContent = response.data;
                saveToCache(urlHash, htmlContent);
            } else {
                console.log(`cache for ${currentUrl}`);
            }

            const $ = cheerio.load(htmlContent);

            const comicImage = $("img#cc-comic");
            const imageUrl = comicImage.attr("src");
            const imageTitle = comicImage.attr("title") || null; // kui title ei ole teen seda nulliks

            if (!imageUrl) {
                console.error(`unable to find image ${currentUrl}`);
                break;
            }

            console.log(`${i + 1}:`, imageUrl, imageTitle);

            const prevLink = $("a.cc-prev").attr("href");
            if (!prevLink) {
                console.error(`unable to find link ${currentUrl}`);
                break;
            }

            currentUrl = new URL(prevLink, "https://www.smbc-comics.com/").href;
        } catch (e) {
            console.error(e.message);
            break;
        }
    }
}

scrapeComics().catch((error) => console.error("Ошибка в скрейпинге:", error.message));
