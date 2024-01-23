import { remote } from "webdriverio";
import cheerio from "cheerio";
import fs from "node:fs"

const url =
  "https://comunica.pje.jus.br/consulta?siglaTribunal=TRF1&dataDisponibilizacaoInicio=2023-07-28&dataDisponibilizacaoFim=2023-07-28";
const browser = await remote({
  capabilities: {
    browserName: "chrome",
    "goog:chromeOptions": {
      args: process.env.CI ? ["headless", "disable-gpu"] : [],
    },
  },
});


async function pageIsComplete() {
  const status = await browser.execute("document.readyState");
  await browser.pause(2000);
  //console.log(status);
  if (status != "complete") return await pageIsComplete();
}

const execute = async () => {

  await browser.url(url);
 
  await pageIsComplete();
  await browser.pause(5000)
  const arr = [];
  
 
  const texto = '[class="tab_panel2 ng-star-inserted"]';
  
  const pages =
    '[class="ui-paginator-page ui-paginator-element ui-state-default ui-corner-all ng-star-inserted"]';
  const paginas = await browser.$$(pages); 
  for (const pagina of paginas) {
   
    
    await browser
      .$('[class="card fadeIn"]')
      .waitForDisplayed({ timeout: 60000 });
    
    const containers = await browser.$$('[class="card fadeIn"]');
   
    for (const ind of containers) {
     
      const temporaria = await browser.$(ind).getHTML();
     
      const $ = cheerio.load(temporaria);
     
      const processo = $('span[class="numero-unico-formatado"]').text().trim();
     
    const  obj ={}
    obj.numeroprocesso = processo.replace(/\D/g, "");
     
      const tabela = $('div[class="info-sumary"]')
        .get()
        .map((div) => {
          return $(div).text().trim();
        });
     
      obj.orgao = tabela[0];
      obj.datadisponibilidade = tabela[1];
      obj.tipocomunicacao = tabela[2];
      obj.meio = tabela[3];
      obj.partes = tabela[6];
      obj.conteudo = $(texto).text();
      arr.push(obj);
    }

    await browser.$(pagina).click(); 
  
    await pageIsComplete();
  }

  //console.log(arr);

fs.writeFileSync("./result.json",JSON.stringify(arr,null,2))
 
  return arr;
};

await execute();

await browser.closeWindow();