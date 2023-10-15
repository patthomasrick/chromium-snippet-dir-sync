const prettier = require("prettier");
const fs = require("fs");
const yargs = require("yargs");

function loadConfig() {
  // Open config.json
  let contents = fs.readFileSync("config.json");
  let config = JSON.parse(contents);

  return config;
}

function loadPreferenceFile(config) {
  // Open the preference file
  let contents = fs.readFileSync(config.preferenceFile);
  let preference = JSON.parse(contents);

  // Get scriptSnippets
  let snippets = preference?.devtools?.preferences?.scriptSnippets;
  if (snippets) return JSON.parse(snippets);
  return [];
}

function prepareSnippetDir(config) {
  // Make the snippet directory if it doesn't exist
  let snippetDir = fs.existsSync(config.snippetDir);
  if (!snippetDir) {
    fs.mkdirSync(config.snippetDir);
  }
}

function saveSnippet(snippetData) {
  let snippetName = snippetData.name;
  let snippetContent = snippetData.content;

  // Save the snippet

  // Run prettier on the snippet content
  snippetContent = prettier.format(snippetContent, {
    parser: "babel",
    semi: true,
    singleQuote: true,
    trailingComma: "es5",
  });

  fs.writeFileSync(`./snippets/${snippetName}.js`, snippetContent);
}

function backupPreferenceFile(config) {
  // Backup the preference file
  let backupFile = `${config.preferenceFile}.bak`;
  fs.copyFileSync(config.preferenceFile, backupFile);
}

function restorePreferenceFile(config) {
  // Restore the preference file from backup
  let backupFile = `${config.preferenceFile}.bak`;
  fs.copyFileSync(backupFile, config.preferenceFile);
}

function packSnippets(config) {
  // Get the snippet files
  let snippetFiles = fs.readdirSync(config.snippetDir);

  // Pack the snippets into a single file
  let snippets = [];
  snippetFiles.forEach((snippetFile) => {
    // Only keep .js files
    if (!snippetFile.endsWith(".js")) return;
    let snippetName = snippetFile.replace(".js", "");
    let snippetContent = fs.readFileSync(`${config.snippetDir}/${snippetFile}`);
    snippets.push({
      name: snippetName,
      content: snippetContent.toString(),
    });
  });

  return JSON.stringify(snippets);
}

function saveToPreferenceFile(config, snippets) {
  // Save the snippets to the preference file
  let preference = JSON.parse(fs.readFileSync(config.preferenceFile));
  preference.devtools.preferences.scriptSnippets = snippets;
  fs.writeFileSync(config.preferenceFile, JSON.stringify(preference));
}

function main() {
  // Are we loading or saving?
  let argv = yargs
    .option("load", {
      alias: "l",
      description: "Load snippets from the preference file",
      type: "boolean",
    })
    .option("save", {
      alias: "s",
      description: "Save snippets to the preference file",
      type: "boolean",
    })
    .option("restore", {
      alias: "r",
      description: "Restore the preference file from backup",
      type: "boolean",
    })
    .help()
    .alias("help", "h").argv;

  let config = loadConfig();

  if (argv.restore) {
    restorePreferenceFile(config);

    console.log(`🔄 Restored preference file!`);

    return 0;
  } else if (argv.load) {
    let snippets = loadPreferenceFile(config);
    prepareSnippetDir(config);
    snippets.forEach((snippet) => saveSnippet(snippet));

    console.log(`✨ Loaded ${snippets.length} snippets!`);

    return 0;
  } else if (argv.save) {
    backupPreferenceFile(config);
    let snippetFiles = packSnippets(config);
    saveToPreferenceFile(config, snippetFiles);

    console.log(`✨ Saved ${JSON.parse(snippetFiles).length} snippets!`);

    return 0;
  }
}

main();
