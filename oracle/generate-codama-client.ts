import { AnchorIdl, rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { renderVisitor } from "@codama/renderers-js";
import { createFromRoot } from "codama";
import { promises as fs } from "fs";
import path from "path";

// Load the policy_challenges IDL
const loadIDL = async (): Promise<AnchorIdl> => {
  const idlPath = path.join(__dirname, "..", "target", "idl", "policy_challenges.json");
  const idlContent = await fs.readFile(idlPath, "utf-8");
  return JSON.parse(idlContent) as AnchorIdl;
};

// Generate Codama client
async function generateClient() {
  try {
    console.log("Generating Codama client for policy_challenges...");
    
    const idl = await loadIDL();
    const codama = createFromRoot(rootNodeFromAnchor(idl));
    
    const outputDir = path.join(__dirname, "src", "generated");
    await fs.mkdir(outputDir, { recursive: true });
    
    codama.accept(renderVisitor(outputDir));
    
    console.log("✅ Codama client generated successfully in src/generated/");
  } catch (error) {
    console.error("❌ Failed to generate Codama client:", error);
    process.exit(1);
  }
}

generateClient();

