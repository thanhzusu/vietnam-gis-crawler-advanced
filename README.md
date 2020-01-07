# Latest extracting date 7th Jan 2020
You are free to use both *.json files for your purpose.
If you want to learn or want to extract information with different data structure, please take a look at next section.
# Build and run the source code
1. yarn or npm
2. Open app.js and edit below information:
+ Cookie, __RequestVerificationToken
+ Based on the latest html structure gis.chinhphu.vn, you can modify two function `parsingDistrictListFromHtml` and `parsingProvinceListFromHtml` with appropriate html tags 
+ Save
3. At the end of file, please umcomment from step 1 to 3 one by one and run `node app.js`
# Credits
Thanks for [vietnam-gis-crawler](https://github.com/linhmtran168/vietnam-gis-crawler). I found this open source library but it seems to be out of date and complicated to build. So I decided to rebuild it with latest tech stacks.

