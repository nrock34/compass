export type Id = number | string;

export type Asset = {
  id: Id;
  documentId?: string;
  public_url: string;
  original_filename?: string;
  alt_text?: string;
  caption?: string;
};

export type BlockData = Record<string, unknown>;

export type Block = {
  id: string;
  type: string;
  mb?: string;
  data: BlockData;
};

export type Document = {
  format: 'editorjs';
  version: 1;
  blocks: Block[];
};
