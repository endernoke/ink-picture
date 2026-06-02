const DEFAULT_CHUNK_SIZE = 4096;

export function makeKittyTransmitChunks(
  imageId: number,
  pngBase64: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): string[] {
  const chunks: string[] = [];

  if (pngBase64.length <= chunkSize) {
    chunks.push(`\x1b_Gf=100,t=d,i=${imageId},m=0,q=2;${pngBase64}\x1b\\`);
    return chunks;
  }

  const firstChunk = pngBase64.slice(0, chunkSize);
  chunks.push(`\x1b_Gf=100,t=d,i=${imageId},m=1,q=2;${firstChunk}\x1b\\`);

  let bufferOffset = chunkSize;
  while (bufferOffset < pngBase64.length - chunkSize) {
    const chunk = pngBase64.slice(bufferOffset, bufferOffset + chunkSize);
    bufferOffset += chunkSize;
    chunks.push(`\x1b_Gm=1,q=2;${chunk}\x1b\\`);
  }

  const lastChunk = pngBase64.slice(bufferOffset);
  chunks.push(`\x1b_Gm=0,q=2;${lastChunk}\x1b\\`);

  return chunks;
}

export function makeKittyPlacement(
  imageId: number,
  placementId: number = 1,
): string {
  return `\x1b_Ga=p,i=${imageId},p=${placementId},C=1,q=2\x1b\\`;
}

export function makeKittyDeletion(
  imageId: number,
  placementId?: number,
): string {
  if (placementId !== undefined) {
    return `\x1b_Ga=d,d=i,p=${placementId},i=${imageId}\x1b\\`;
  }
  return `\x1b_Ga=d,d=I,i=${imageId}\x1b\\`;
}
