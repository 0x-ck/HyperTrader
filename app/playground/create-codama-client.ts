// From https://solana.stackexchange.com/questions/16703/can-anchor-client-be-used-with-solana-web3-js-2-0rc
import { AnchorIdl, rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { renderVisitor } from "@codama/renderers-js";
import { createFromRoot } from "codama";
import { promises as fs } from "fs";
import _ from "lodash";
import path from "path";

// Find the Anchor IDL file and return the JSON object
const loadAnchorIDLs = async () => {
  const basePath = path.join("..", "..", "target", "idl");
  const dirPath = path.join(basePath);

  try {
    // Read the directory contents
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    if (jsonFiles.length === 0) {
      throw new Error(`No JSON files found in ${dirPath}`);
    }

    const filePaths = jsonFiles.map((p) => path.join(dirPath, p));
    return Promise.all(
      filePaths.map(async (filePath) =>
        JSON.parse(await fs.readFile(filePath, "utf-8")) as AnchorIdl
      )
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Failed to load IDL: ${dirPath} does not exist`);
    }
    throw error;
  }
};

// Instantiate Codama
const idls = await loadAnchorIDLs();

for (const idl of idls) {
  if (idl.metadata === undefined) {
    throw new Error("IDL metadata is undefined");
  }
  if (!("name" in idl.metadata)) {
    throw new Error("IDL metadata name is undefined");
  }
  const name = _.camelCase(idl.metadata.name);
  const codama = createFromRoot(rootNodeFromAnchor(idl as AnchorIdl));

  const dist = path.join("src", "protocol", name);
  codama.accept(renderVisitor(dist));
}