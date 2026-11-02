// SADECE YEREL GELİŞTİRME İÇİN: Rebrickable'a erişilemeyen ortamlarda arayüzü
// denemek için küçük bir örnek katalog yazar. Yayında hiçbir zaman kullanılmaz;
// GitHub Actions `npm run catalog` ile gerçek kataloğu üretir.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/catalog.json');

const themes = [
  [1, 'Technic', null],
  [52, 'City', null],
  [158, 'Star Wars', null],
  [171, 'Ultimate Collector Series', 158],
  [246, 'Harry Potter', null],
  [252, 'Architecture', null],
  [435, 'Ninjago', null],
  [494, 'Friends', null],
  [576, 'Ideas', null],
  [577, 'Minecraft', null],
  [601, 'Speed Champions', null],
  [608, 'Disney', null],
  [672, 'Creator 3-in-1', null],
  [695, 'Super Heroes DC', null],
  [696, 'Super Heroes Marvel', null],
  [721, 'Icons', null],
  [722, 'Botanical Collection', 721],
  [723, 'The Lord of the Rings', 721],
];

const sets = [
  ['75192-1', 'Millennium Falcon', 2017, 171, 7541, 8],
  ['75313-1', 'AT-AT', 2021, 171, 6785, 9],
  ['75331-1', 'The Razor Crest', 2022, 171, 6187, 4],
  ['75367-1', 'Venator-Class Republic Attack Cruiser', 2023, 171, 5374, 2],
  ['75397-1', "Jabba's Sail Barge", 2024, 171, 3942, 11],
  ['75355-1', 'X-Wing Starfighter', 2023, 171, 1949, 0],
  ['75375-1', 'Millennium Falcon', 2024, 158, 921, 0],
  ['10294-1', 'Titanic', 2021, 721, 9090, 0],
  ['10307-1', 'Eiffel Tower', 2022, 721, 10001, 0],
  ['10305-1', "Lion Knights' Castle", 2022, 721, 4514, 22],
  ['10316-1', 'Rivendell', 2023, 723, 6167, 15],
  ['10333-1', 'Barad-dûr', 2024, 723, 5471, 10],
  ['10332-1', 'Medieval Town Square', 2024, 721, 3304, 8],
  ['10318-1', 'Concorde', 2023, 721, 2083, 0],
  ['10341-1', 'NASA Artemis Space Launch System', 2024, 721, 3601, 0],
  ['10497-1', 'Galaxy Explorer', 2022, 721, 1254, 4],
  ['10311-1', 'Orchid', 2022, 722, 608, 0],
  ['10280-1', 'Flower Bouquet', 2021, 722, 756, 0],
  ['10328-1', 'Bouquet of Roses', 2024, 722, 822, 0],
  ['71043-1', 'Hogwarts Castle', 2018, 246, 6020, 4],
  ['76419-1', 'Hogwarts Castle and Grounds', 2023, 246, 2660, 0],
  ['76437-1', 'The Burrow – Collectors’ Edition', 2024, 246, 2405, 10],
  ['42143-1', 'Ferrari Daytona SP3', 2022, 1, 3778, 0],
  ['42115-1', 'Lamborghini Sián FKP 37', 2020, 1, 3696, 0],
  ['42171-1', 'Mercedes-AMG F1 W14 E Performance', 2024, 1, 1642, 0],
  ['42172-1', 'McLaren P1', 2024, 1, 3893, 0],
  ['21318-1', 'Tree House', 2019, 576, 3036, 4],
  ['21323-1', 'Grand Piano', 2020, 576, 3662, 0],
  ['21333-1', 'Vincent van Gogh - The Starry Night', 2022, 576, 2316, 1],
  ['21348-1', "Dungeons & Dragons: Red Dragon's Tale", 2024, 576, 3745, 7],
  ['60337-1', 'Express Passenger Train', 2022, 52, 764, 4],
  ['60380-1', 'Downtown', 2023, 52, 2010, 14],
  ['31120-1', 'Medieval Castle', 2021, 672, 1426, 3],
  ['31109-1', 'Pirate Ship', 2020, 672, 1264, 4],
  ['71799-1', 'NINJAGO City Markets', 2023, 435, 6163, 21],
  ['71741-1', 'NINJAGO City Gardens', 2021, 435, 5685, 19],
  ['76178-1', 'Daily Bugle', 2021, 696, 3772, 25],
  ['76269-1', 'Avengers Tower', 2023, 696, 5201, 31],
  ['76139-1', '1989 Batmobile', 2019, 695, 3306, 3],
  ['43222-1', 'Disney Castle', 2023, 608, 4837, 8],
  ['43197-1', 'The Ice Castle', 2021, 608, 1709, 3],
  ['21246-1', 'The Deep Dark Battle', 2023, 577, 584, 3],
  ['76917-1', '2 Fast 2 Furious Nissan Skyline GT-R (R34)', 2023, 601, 319, 1],
  ['41757-1', 'Botanical Garden', 2023, 494, 1072, 7],
  ['21058-1', 'Great Pyramid of Giza', 2022, 252, 1476, 0],
  ['21060-1', 'Himeji Castle', 2023, 252, 2125, 0],
].map((s) => [...s, 1]);

sets.sort((a, b) => b[2] - a[2] || b[4] - a[4]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ v: 1, source: 'dev-fixture', generated: new Date().toISOString(), themes, sets }),
);
console.log(`Geliştirme kataloğu yazıldı (${sets.length} set) → ${OUT}`);
