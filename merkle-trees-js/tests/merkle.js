'strict';

const chai = require('chai');
const { expect } = chai;
const { generateElements } = require('./helpers');
const MerkleTree = require('../src');

const testBuildTree = (elementCount, seed, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);

  expect(merkleTree.root.toString('hex')).to.equal(expected.root);
  expect(merkleTree.elementRoot.toString('hex')).to.equal(expected.elementRoot);
  expect(merkleTree.depth).to.equal(expected.depth);
  merkleTree.elements.forEach((e, i) => expect(e.equals(elements[i])).to.be.true);
  expect(merkleTree.elements.length).to.equal(elements.length);
};

const compareTrees = (elementCount, optionsA, optionsB) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const treeA = new MerkleTree(elements, optionsA);
  const treeB = new MerkleTree(elements, optionsB);

  expect(treeA.root.equals(treeB.root)).to.be.true;
  expect(treeA.elementRoot.equals(treeB.elementRoot)).to.be.true;
  expect(treeA.depth).to.equal(treeB.depth);
  treeA.elements.forEach((e, i) => expect(e.equals(treeB.elements[i])).to.be.true);
  expect(treeA.elements.length).to.equal(treeB.elements.length);
};

const testSingleProofGeneration = (elementCount, seed, index, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateSingleProof(index);

  expect(proof.root.equals(merkleTree.root)).to.be.true;
  expect(proof.elementCount).to.equal(elementCount);
  expect(proof.index).to.equal(index);
  expect(proof.element.equals(elements[index])).to.be.true;
  expect(proof.decommitments.length).to.equal(expected.decommitments.length);
  proof.decommitments.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.decommitments[i]));
};

const compareSingleProofs = (elementCount, index, optionsA, optionsB) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const treeA = new MerkleTree(elements, optionsA);
  const proofA = treeA.generateSingleProof(index);
  const treeB = new MerkleTree(elements, optionsB);
  const proofB = treeB.generateSingleProof(index);

  expect(proofA.root.equals(proofB.root)).to.be.true;
  expect(proofA.elementCount).to.equal(proofB.elementCount);
  expect(proofA.index).to.equal(proofB.index);
  expect(proofA.element.equals(proofB.element)).to.be.true;
  expect(proofA.decommitments.length).to.equal(proofB.decommitments.length);
  proofA.decommitments.forEach((d, i) => expect(d.equals(proofB.decommitments[i])).to.be.true);
};

const testSingleProofVerification = (elementCount, index, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateSingleProof(index);
  const proofValid = MerkleTree.verifySingleProof(proof, options);

  expect(proofValid).to.be.true;
};

const testSingleUpdate = (elementCount, index, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const newElement = generateElements(1, { seed: '11' })[0];
  const proof = merkleTree.generateSingleUpdateProof(index, newElement);
  const { root } = MerkleTree.updateWithSingleProof(proof, options);
  const newElements = elements.map((e, i) => (i === index ? newElement : e));
  const newMerkleTree1 = new MerkleTree(newElements, options);
  const newMerkleTree2 = merkleTree.updateSingle(index, newElement);

  expect(root.equals(newMerkleTree1.root)).to.be.true;
  expect(root.equals(newMerkleTree2.root)).to.be.true;
};

const testConsecutiveSingleUpdate = (iterations, elementCount, options) => {
  let elements = generateElements(elementCount);
  let merkleTree = new MerkleTree(elements, options);
  let root = null;

  for (let i = 0; i < iterations; i++) {
    const index = Math.floor(Math.random() * elementCount);
    const newElement = generateElements(1, { random: true })[0];
    const proof = merkleTree.generateSingleUpdateProof(index, newElement);
    root = MerkleTree.updateWithSingleProof(proof, options).root;
    elements[index] = newElement;
    merkleTree = merkleTree.updateSingle(index, newElement);

    expect(root.equals(merkleTree.root)).to.be.true;
  }

  const finalMerkleTree = new MerkleTree(elements, options);

  expect(root.equals(finalMerkleTree.root)).to.be.true;
};

const testMultiProofGeneration = (elementCount, seed, indices, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateMultiProof(indices, options);

  expect(proof.root.equals(merkleTree.root)).to.be.true;
  expect(proof.elementCount).to.equal(elementCount);
  expect(proof.elements.length).to.equal(indices.length);
  proof.elements.forEach((e, i) => expect(e.equals(elements[indices[i]])).to.be.true);
  expect(proof.decommitments.length).to.equal(expected.decommitments.length);
  proof.decommitments.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.decommitments[i]));

  if (options.indexed) {
    expect(proof.indices).to.deep.equal(indices);
    return;
  }

  if (options.bitFlags) {
    expect(proof.flags.toString('hex')).to.equal(expected.flags);
    expect(proof.skips.toString('hex')).to.equal(expected.skips);
    return;
  }

  expect(proof.flags).to.deep.equal(expected.flags);
  expect(proof.skips).to.deep.equal(expected.skips);
};

const compareMultiProofs = (elementCount, indices, optionsA, optionsB) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const treeA = new MerkleTree(elements, optionsA);
  const proofA = treeA.generateMultiProof(indices, optionsA);
  const treeB = new MerkleTree(elements, optionsB);
  const proofB = treeB.generateMultiProof(indices, optionsB);

  expect(proofA.root.equals(proofB.root)).to.be.true;
  expect(proofA.elementCount).to.equal(proofB.elementCount);
  proofA.elements.forEach((e, i) => expect(e.equals(proofB.elements[i])).to.be.true);
  expect(proofA.elements.length).to.equal(proofB.elements.length);
  proofA.decommitments.forEach((d, i) => expect(d.equals(proofB.decommitments[i])).to.be.true);
  expect(proofA.decommitments.length).to.equal(proofB.decommitments.length);

  if (optionsA.indexed && optionsB.indexed) {
    expect(proofA.indices).to.deep.equal(proofB.indices);
    return;
  }

  if (optionsA.bitFlags && optionsB.bitFlags) {
    expect(proofA.flags.equals(proofB.flags)).to.be.true;
    expect(proofA.skips.equals(proofB.skips)).to.be.true;
    return;
  }

  expect(proofA.flags).to.deep.equal(proofB.flags);
  expect(proofA.skips).to.deep.equal(proofB.skips);
};

const testMultiProofVerification = (elementCount, indices, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateMultiProof(indices, options);
  const proofValid = MerkleTree.verifyMultiProof(proof, options);

  expect(proofValid).to.be.true;
};

const testMultiUpdate = (elementCount, indices, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const newElements = generateElements(indices.length, { seed: '11' });
  const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
  const { root } = MerkleTree.updateWithMultiProof(proof, options);

  const newTreeElements = elements.map((e, i) => {
    const index = indices.indexOf(i);

    return index >= 0 ? newElements[index] : e;
  });

  const newMerkleTree1 = new MerkleTree(newTreeElements, options);
  const newMerkleTree2 = merkleTree.updateMulti(indices, newElements);

  expect(root.equals(newMerkleTree1.root)).to.be.true;
  expect(root.equals(newMerkleTree2.root)).to.be.true;
};

const testConsecutiveMultiUpdate = (iterations, elementCount, updateSize, options) => {
  let elements = generateElements(elementCount);
  let merkleTree = new MerkleTree(elements, options);
  let root = null;

  for (let i = 0; i < iterations; i++) {
    const rawNewElements = Array.from({ length: updateSize }, () => generateElements(updateSize, { random: true }));
    const rawIndices = rawNewElements.map(() => Math.floor(Math.random() * elementCount));
    const indices = rawIndices.filter((index, i) => rawIndices.indexOf(index) === i).sort((a, b) => b - a);
    const newElements = rawNewElements.slice(0, indices.length);

    const proof = merkleTree.generateMultiUpdateProof(indices, newElements, options);
    root = MerkleTree.updateWithMultiProof(proof, options).root;

    elements = elements.map((element, i) => {
      const index = indices.indexOf(i);

      return index >= 0 ? newElements[index] : element;
    });

    merkleTree = merkleTree.updateMulti(indices, newElements);

    expect(root.equals(merkleTree.root)).to.be.true;
  }

  const finalMerkleTree = new MerkleTree(elements, options);

  expect(root.equals(finalMerkleTree.root)).to.be.true;
};

const testAppendProofGeneration = (elementCount, seed, expected, options) => {
  const elements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateAppendProof();

  expect(proof.root.equals(merkleTree.root)).to.be.true;
  expect(proof.elementCount).to.equal(elementCount);
  proof.decommitments.forEach((d, i) => expect(d.toString('hex')).to.equal(expected.decommitments[i]));
  expect(proof.decommitments.length).to.equal(expected.decommitments.length);
};

const testAppendProofVerification = (elementCount, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateAppendProof();
  const proofValid = MerkleTree.verifyAppendProof(proof, options);

  expect(proofValid).to.be.true;
};

const testSingleAppend = (elementCount, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const newElement = generateElements(1, { seed: '11' })[0];
  const proof = merkleTree.generateSingleAppendProof(newElement);
  const { root, elementCount: newElementCount } = MerkleTree.appendSingleWithProof(proof, options);

  const newElements = elements.concat(newElement);
  const newMerkleTree1 = new MerkleTree(newElements, options);
  const newMerkleTree2 = merkleTree.appendSingle(newElement);

  expect(root.equals(newMerkleTree1.root)).to.be.true;
  expect(root.equals(newMerkleTree2.root)).to.be.true;
  expect(newElementCount).to.equal(newMerkleTree1.elements.length);
  expect(newElementCount).to.equal(newMerkleTree2.elements.length);
};

const testConsecutiveSingleAppend = (iterations, elementCount, options) => {
  let elements = generateElements(elementCount);
  let merkleTree = new MerkleTree(elements, options);
  let root = null;

  for (let i = 0; i < iterations; i++) {
    const newElement = generateElements(1, { random: true })[0];
    const proof = merkleTree.generateSingleAppendProof(newElement);
    const results = MerkleTree.appendSingleWithProof(proof, options);
    root = results.root;

    elements.push(newElement);
    merkleTree = merkleTree.appendSingle(newElement);

    expect(root.equals(merkleTree.root)).to.equal(true);
    expect(results.elementCount).to.equal(merkleTree.elements.length);
  }

  const finalMerkleTree = new MerkleTree(elements, options);

  expect(root.equals(finalMerkleTree.root)).to.be.true;
};

const testMultiAppend = (elementCount, appendSize, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const appendElements = generateElements(appendSize, { seed: '11' });
  const proof = merkleTree.generateMultiAppendProof(appendElements);
  const { root, elementCount: newElementCount } = MerkleTree.appendMultiWithProof(proof, options);
  const newElements = elements.concat(appendElements);
  const newMerkleTree1 = new MerkleTree(newElements, options);
  const newMerkleTree2 = merkleTree.appendMulti(appendElements);

  expect(root.equals(newMerkleTree1.root)).to.be.true;
  expect(root.equals(newMerkleTree2.root)).to.be.true;
  expect(newElementCount).to.equal(newMerkleTree1.elements.length);
  expect(newElementCount).to.equal(newMerkleTree2.elements.length);
};

const testConsecutiveMultiAppend = (iterations, elementCount, appendSize, options) => {
  let elements = generateElements(elementCount);
  let merkleTree = new MerkleTree(elements, options);
  let root = null;

  for (let i = 0; i < iterations; i++) {
    const newElements = generateElements(Math.ceil(Math.random() * appendSize));
    const proof = merkleTree.generateMultiAppendProof(newElements);
    const results = MerkleTree.appendMultiWithProof(proof, options);
    root = results.root;

    elements = elements.concat(newElements);
    merkleTree = merkleTree.appendMulti(newElements);

    expect(root.equals(merkleTree.root)).to.be.true;
    expect(results.elementCount).to.equal(merkleTree.elements.length);
  }

  const finalMerkleTree = new MerkleTree(elements, options);

  expect(root.equals(finalMerkleTree.root)).to.be.true;
};

const testCombinedProofMinimumIndex = (elementCount, expected, options) => {
  const elements = generateElements(elementCount);
  const merkleTree = new MerkleTree(elements, options);
  const minimumIndex = merkleTree.getMinimumCombinedProofIndex();
  expect(minimumIndex).to.equal(expected.minimumIndex);
};

const testCombinedProofGeneration = (elementCount, seed, updateIndices, appendSize, options) => {
  const originalElements = generateElements(elementCount, { seed });
  const merkleTree = new MerkleTree(originalElements, options);
  const uElements = generateElements(updateIndices.length, { seed: '11' });
  const aElements = generateElements(appendSize, { seed: '22' });
  const combinedProof = merkleTree.generateCombinedProof(updateIndices, uElements, aElements, options);
  const { elements, updateElements, appendElements } = combinedProof;
  const multiProof = merkleTree.generateMultiProof(updateIndices, options);

  combinedProof.decommitments.forEach((d, i) => expect(d.equals(multiProof.decommitments[i])).to.be.true);
  expect(combinedProof.decommitments.length).to.equal(multiProof.decommitments.length);
  elements.forEach((e, i) => expect(e.equals(originalElements[updateIndices[i]])).to.be.true);
  expect(elements.length).to.equal(updateIndices.length);
  updateElements.forEach((e, i) => expect(e.equals(uElements[i])).to.be.true);
  expect(updateElements.length).to.equal(uElements.length);
  appendElements.forEach((e, i) => expect(e.equals(aElements[i])).to.be.true);
  expect(appendElements.length).to.equal(aElements.length);
};

const testCombinedProofVerification = (elementCount, updateIndices, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const proof = merkleTree.generateCombinedProof(updateIndices, [], [], options);
  const proofValid = MerkleTree.verifyCombinedProof(proof, options);

  expect(proofValid).to.be.true;
};

const testCombinedUpdateAndAppend = (elementCount, updateIndices, appendSize, options) => {
  const elements = generateElements(elementCount, { seed: 'ff' });
  const merkleTree = new MerkleTree(elements, options);
  const uElements = generateElements(updateIndices.length, { seed: '11' });
  const aElements = generateElements(appendSize, { seed: '22' });
  const proof = merkleTree.generateCombinedProof(updateIndices, uElements, aElements, options);
  const { root, elementCount: newElementCount } = MerkleTree.updateAndAppendWithCombinedProof(proof, options);

  const updatedElements = elements.map((e, i) => {
    const index = updateIndices.indexOf(i);

    return index >= 0 ? uElements[index] : e;
  });

  const newElements = updatedElements.concat(aElements);
  const newMerkleTree1 = new MerkleTree(newElements, options);
  const newMerkleTree2 = merkleTree.updateAndAppendMulti(updateIndices, uElements, aElements);
  const newMerkleTree3 = merkleTree.updateMulti(updateIndices, uElements).appendMulti(aElements);
  const newMerkleTree4 = merkleTree.appendMulti(aElements).updateMulti(updateIndices, uElements);

  expect(root.equals(newMerkleTree1.root)).to.be.true;
  expect(root.equals(newMerkleTree2.root)).to.be.true;
  expect(root.equals(newMerkleTree3.root)).to.be.true;
  expect(root.equals(newMerkleTree4.root)).to.be.true;
  expect(newElementCount).to.equal(newMerkleTree1.elements.length);
  expect(newElementCount).to.equal(newMerkleTree2.elements.length);
  expect(newElementCount).to.equal(newMerkleTree3.elements.length);
  expect(newElementCount).to.equal(newMerkleTree4.elements.length);
};

const testConsecutiveUpdateAndAppend = (iterations, elementCount, updateSize, appendSize, options) => {
  let elements = generateElements(elementCount);
  let merkleTree = new MerkleTree(elements, options);
  let root = null;

  for (let i = 0; i < iterations; i++) {
    const rawUpdateElements = generateElements(updateSize, { random: true });
    const rawUpdateIndices = rawUpdateElements.map(() => Math.floor(Math.random() * elements.length));
    const minimumIndex = merkleTree.getMinimumCombinedProofIndex();
    rawUpdateIndices[0] = Math.floor(Math.random() * (elements.length - minimumIndex) + minimumIndex);
    const updateIndices = rawUpdateIndices.filter((index, i, arr) => arr.indexOf(index) === i).sort((a, b) => b - a);
    const updateElements = rawUpdateElements.slice(0, updateIndices.length);
    const appendElements = generateElements(Math.ceil(Math.random() * appendSize), { random: true });

    const proof = merkleTree.generateCombinedProof(updateIndices, updateElements, appendElements);
    const results = MerkleTree.updateAndAppendWithCombinedProof(proof);
    root = results.root;

    elements = elements
      .map((element, i) => {
        const index = updateIndices.indexOf(i);

        return index >= 0 ? updateElements[index] : element;
      })
      .concat(appendElements);

    merkleTree = merkleTree.updateAndAppendMulti(updateIndices, updateElements, appendElements);

    expect(root.equals(merkleTree.root)).to.be.true;
    expect(results.elementCount).to.equal(merkleTree.elements.length);
  }

  const finalMerkleTree = new MerkleTree(elements, options);

  expect(root.equals(finalMerkleTree.root)).to.be.true;
};

describe('Merkle-Tree', () => {
  describe('Merkle Tree Construction', () => {
    describe('Balanced', () => {
      it('should build a 8-element Merkle Tree.', () => {
        const expected = {
          root: 'd2fa9d47845f1571f1318afaaabc63a55cc57af3f511e42fc30e05f171d6853d',
          elementRoot: '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4',
          depth: 3,
        };

        testBuildTree(8, 'ff', expected, { unbalanced: false, sortedHash: false });
      });

      it('should build a 1-element Merkle Tree.', () => {
        const expected = {
          root: 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8',
          elementRoot: '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
          depth: 0,
        };

        testBuildTree(1, 'ff', expected, { unbalanced: false, sortedHash: false });
      });

      it('should build a balanced sorted-hash 8-element Merkle Tree.', () => {
        const expected = {
          root: '6764fd6d226590b844285c3d0f1e12bbd19cb7d1ee8277b0fb5b9b45efbbffb6',
          elementRoot: '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221',
          depth: 3,
        };

        testBuildTree(8, 'ff', expected, { unbalanced: false, sortedHash: true });
      });

      it('should build a balanced sorted-hash 1-element Merkle Tree.', () => {
        const expected = {
          root: 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8',
          elementRoot: '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
          depth: 0,
        };

        testBuildTree(1, 'ff', expected, { unbalanced: false, sortedHash: true });
      });
    });

    describe('Unbalanced', () => {
      it('should build an 9-element Merkle Tree.', () => {
        const expected = {
          root: '743605bc7fcb07d66ecf3f2b5fcea24bfb27901bfbdb7baf6a194aa45d62461d',
          elementRoot: '5449a839359e08115bbc14ed1795892a3a8562d583744e1a1fa146d273ff1f55',
          depth: 4,
        };

        testBuildTree(9, 'ff', expected, { unbalanced: true, sortedHash: false });
      });

      it('should build an sorted-hash 9-element Merkle Tree.', () => {
        const expected = {
          root: '4c10104ea544f26190809c1117a092b18c8d7ab892f23c30a0f0cdb2c5242c48',
          elementRoot: '86620d93d22f2d06344f81166356ed881cfdc36c8b35a7115e8b0daad4d56ee4',
          depth: 4,
        };

        testBuildTree(9, 'ff', expected, { unbalanced: true, sortedHash: true });
      });
    });

    describe('Balanced/Unbalanced Overlapping Cases', () => {
      it('should build the same 8-element Merkle Tree.', () => {
        compareTrees(8, { unbalanced: false, sortedHash: false }, { unbalanced: true, sortedHash: false });
      });

      it('should build the same sorted-hash 8-element Merkle Tree.', () => {
        compareTrees(8, { unbalanced: false, sortedHash: true }, { unbalanced: true, sortedHash: true });
      });
    });
  });

  describe('Single Proofs', () => {
    describe('Single Proof Generation', () => {
      describe('Balanced', () => {
        it('should generate a Single Proof for a 8-element Merkle Tree.', () => {
          const expected = {
            decommitments: [
              'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
            ],
          };

          testSingleProofGeneration(8, 'ff', 2, expected, { unbalanced: false, sortedHash: false });
        });

        it('should generate a Single Proof for a 1-element Merkle Tree.', () => {
          const expected = {
            decommitments: [],
          };

          testSingleProofGeneration(1, 'ff', 0, expected, { unbalanced: false, sortedHash: false });
        });

        it('should generate a Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const expected = {
            decommitments: [
              'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
            ],
          };

          testSingleProofGeneration(8, 'ff', 2, expected, { unbalanced: false, sortedHash: true });
        });

        it('should generate a Single Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const expected = {
            decommitments: [],
          };

          testSingleProofGeneration(1, 'ff', 0, expected, { unbalanced: false, sortedHash: true });
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Single Proof for a 9-element Merkle Tree.', () => {
          const expected = {
            decommitments: ['0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4'],
          };

          testSingleProofGeneration(9, 'ff', 8, expected, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a 27-element Merkle Tree.', () => {
          const expected = {
            decommitments: [
              'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be',
              '88d2a11c3b0935fc6a30e3b0a69fa58a84de08ea333248f23e5d747613fc04f9',
              '289b3d65643b54739112fa7df258736b511ed1b5611e4f9ce681ae39fbd5fd8b',
              'c43e6f0c51c26c040dc4a40e372839ccc4a53c1762504da451819ae9e93d239a',
            ],
          };

          testSingleProofGeneration(27, 'ff', 25, expected, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a 100-element Merkle Tree.', () => {
          const expected = {
            decommitments: [
              'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5',
              '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203',
              'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681',
              '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c',
            ],
          };

          testSingleProofGeneration(100, 'ff', 97, expected, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a sorted-hash 9-element Merkle Tree.', () => {
          const expected = {
            decommitments: ['7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221'],
          };

          testSingleProofGeneration(9, 'ff', 8, expected, { unbalanced: true, sortedHash: true });
        });

        it('should verify a Single Proof for a sorted-hash 27-element Merkle Tree.', () => {
          const expected = {
            decommitments: [
              '2c2cdc952c9d537709959cd357f6268fff33e5e21147f1a23db6cae78fb91eb9',
              'c62e1d7cf122111fa068da94e48ecd21cb02bba4bd41d56e9f4b69a4509a2962',
              '289b3d65643b54739112fa7df258736b511ed1b5611e4f9ce681ae39fbd5fd8b',
              'c43e6f0c51c26c040dc4a40e372839ccc4a53c1762504da451819ae9e93d239a',
            ],
          };

          testSingleProofGeneration(27, 'ff', 25, expected, { unbalanced: true, sortedHash: true });
        });

        it('should verify a Single Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const expected = {
            decommitments: [
              'bb9a6e5787ae741c6a0e75a360aefe75ee06284ece1edddc1573ac9462945e7f',
              '904afce76e0f7ccead463e22aec76018c1450afd3deb4f387e0617ef39721685',
              'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681',
              '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c',
            ],
          };

          testSingleProofGeneration(100, 'ff', 97, expected, { unbalanced: true, sortedHash: true });
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should generate the same Single Proof for a 8-element Merkle Tree.', () => {
          compareSingleProofs(8, 2, { unbalanced: false, sortedHash: false }, { unbalanced: true, sortedHash: false });
        });

        it('should generate the same Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          compareSingleProofs(8, 2, { unbalanced: false, sortedHash: true }, { unbalanced: true, sortedHash: true });
        });
      });
    });

    describe('Single Proof Verification', () => {
      describe('Balanced', () => {
        it('should verify a Single Proof for a 8-element Merkle Tree.', () => {
          testSingleProofVerification(8, 2, { unbalanced: false, sortedHash: false });
        });

        it('should verify a Single Proof for a 1-element Merkle Tree.', () => {
          testSingleProofVerification(1, 0, { unbalanced: false, sortedHash: false });
        });

        it('should verify a Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          testSingleProofVerification(8, 2, { unbalanced: false, sortedHash: true });
        });

        it('should verify a Single Proof for a sorted-hash 1-element Merkle Tree.', () => {
          testSingleProofVerification(1, 0, { unbalanced: false, sortedHash: true });
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Single Proof for a 9-element Merkle Tree.', () => {
          testSingleProofVerification(9, 8, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a 27-element Merkle Tree.', () => {
          testSingleProofVerification(27, 25, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a 100-element Merkle Tree.', () => {
          testSingleProofVerification(100, 97, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a sorted-hash 9-element Merkle Tree.', () => {
          testSingleProofVerification(9, 8, { unbalanced: true, sortedHash: true });
        });

        it('should verify a Single Proof for a sorted-hash 27-element Merkle Tree.', () => {
          testSingleProofVerification(27, 25, { unbalanced: true, sortedHash: true });
        });

        it('should verify a Single Proof for a sorted-hash 100-element Merkle Tree.', () => {
          testSingleProofVerification(100, 97, { unbalanced: true, sortedHash: true });
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should verify a Single Proof for a 8-element Merkle Tree, built with the unbalanced option.', () => {
          testSingleProofVerification(8, 2, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
          testSingleProofVerification(8, 2, { unbalanced: true, sortedHash: true });
        });
      });
    });

    describe('Single Proof Update', () => {
      describe('Balanced', () => {
        it('should use a Single Proof for a 8-element Merkle Tree to update an element.', () => {
          testSingleUpdate(8, 2, { unbalanced: false, sortedHash: false });
        });

        it('should use a Single Proof for a 1-element Merkle Tree to update an element.', () => {
          testSingleUpdate(1, 0, { unbalanced: false, sortedHash: false });
        });

        it('should use a Single Proof for a sorted-hash 8-element Merkle Tree to update an element.', () => {
          testSingleUpdate(8, 2, { unbalanced: false, sortedHash: true });
        });

        it('should use a Single Proof for a sorted-hash 1-element Merkle Tree to update an element.', () => {
          testSingleUpdate(1, 0, { unbalanced: false, sortedHash: true });
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Single Proof for a 9-element Merkle Tree.', () => {
          testSingleUpdate(9, 8, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a 27-element Merkle Tree.', () => {
          testSingleUpdate(27, 25, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a 100-element Merkle Tree.', () => {
          testSingleUpdate(100, 97, { unbalanced: true, sortedHash: false });
        });

        it('should verify a Single Proof for a sorted-hash 9-element Merkle Tree.', () => {
          testSingleUpdate(9, 8, { unbalanced: true, sortedHash: true });
        });

        it('should verify a Single Proof for a sorted-hash 27-element Merkle Tree.', () => {
          testSingleUpdate(27, 25, { unbalanced: true, sortedHash: true });
        });

        it('should verify a Single Proof for a sorted-hash 100-element Merkle Tree.', () => {
          testSingleUpdate(100, 97, { unbalanced: true, sortedHash: true });
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should use a Single Proof for a 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
          testSingleUpdate(8, 2, { unbalanced: true, sortedHash: false });
        });

        it('should use a Single Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
          testSingleUpdate(8, 2, { unbalanced: true, sortedHash: true });
        });
      });
    });

    describe('Single Proof Update Consecutive Uses', () => {
      describe('Balanced', () => {
        it('should use 100 Single Proofs for a 16-element Merkle Tree, to update an 100 elements consecutively.', () => {
          testConsecutiveSingleUpdate(100, 16, { unbalanced: false, sortedHash: false });
        });
      });

      describe('Unbalanced', () => {
        it('should use 100 Single Proofs for a 25-element Merkle Tree, to update an 100 elements consecutively.', () => {
          testConsecutiveSingleUpdate(100, 25, { unbalanced: true, sortedHash: false });
        });
      });
    });
  });

  describe('Multi Proofs', () => {
    describe('Index and Existence Multi Proofs', () => {
      describe('Index and Existence Multi Proof Generation', () => {
        describe('Balanced', () => {
          it('should generate a Multi Proof for a 8-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            const expected = {
              decommitments: [
                '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
                '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
                'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
              ],
            };

            testMultiProofGeneration(8, 'ff', [5, 4, 1], expected, options);
          });

          it('should generate a Multi Proof for a 1-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: false, indexed: true };
            const expected = {
              decommitments: [],
            };

            testMultiProofGeneration(1, 'ff', [0], expected, options);
          });

          it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
            const expected = {
              decommitments: [
                '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
                'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
              ],
            };

            testMultiProofGeneration(8, 'ff', [5, 4, 1], expected, options);
          });

          it('should generate a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
            const options = { unbalanced: false, sortedHash: true, indexed: true };
            const expected = {
              decommitments: [],
            };

            testMultiProofGeneration(1, 'ff', [0], expected, options);
          });
        });

        describe.skip('Unbalanced (TODO)', () => {});

        describe('Balanced/Unbalanced Overlapping Cases', () => {
          it('should generate the same Multi Proof for a 8-element Merkle Tree.', () => {
            const balancedOptions = { unbalanced: false, sortedHash: false, indexed: true };
            const unbalancedOptions = { unbalanced: true, sortedHash: false, indexed: true };
            compareMultiProofs(8, [5, 4, 1], balancedOptions, unbalancedOptions);
          });

          it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
            const balancedOptions = { unbalanced: false, sortedHash: true, indexed: true };
            const unbalancedOptions = { unbalanced: true, sortedHash: true, indexed: true };
            compareMultiProofs(8, [5, 4, 1], balancedOptions, unbalancedOptions);
          });
        });
      });

      describe('Index and Existence Multi Proof Verification', () => {
        describe('Balanced', () => {
          it('should verify a Multi Proof for a 8-element Merkle Tree.', () => {
            testMultiProofVerification(8, [5, 4, 1], { unbalanced: false, sortedHash: false, indexed: true });
          });

          it('should verify a Multi Proof for a 1-element Merkle Tree.', () => {
            testMultiProofVerification(1, [0], { unbalanced: false, sortedHash: false, indexed: true });
          });

          it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
            testMultiProofVerification(8, [5, 4, 1], { unbalanced: false, sortedHash: true, indexed: true });
          });

          it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
            testMultiProofVerification(1, [0], { unbalanced: false, sortedHash: true, indexed: true });
          });
        });

        describe.skip('Unbalanced (TODO)', () => {});

        describe('Balanced/Unbalanced Overlapping Cases', () => {
          it('should verify a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option.', () => {
            testMultiProofVerification(8, [5, 4, 1], { unbalanced: true, sortedHash: false, indexed: true });
          });

          it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
            testMultiProofVerification(8, [5, 4, 1], { unbalanced: true, sortedHash: true, indexed: true });
          });
        });
      });

      describe('Index and Existence Multi Proof Update', () => {
        describe('Balanced', () => {
          it('should use a Multi Proof for a 8-element Merkle Tree to update elements.', () => {
            testMultiUpdate(8, [5, 4, 1], { unbalanced: false, sortedHash: false, indexed: true });
          });

          it('should use a Multi Proof for a 1-element Merkle Tree to update elements.', () => {
            testMultiUpdate(1, [0], { unbalanced: false, sortedHash: false, indexed: true });
          });

          it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements.', () => {
            testMultiUpdate(8, [5, 4, 1], { unbalanced: false, sortedHash: true, indexed: true });
          });

          it('should use a Multi Proof for a sorted-hash 1-element Merkle Tree to update elements.', () => {
            testMultiUpdate(1, [0], { unbalanced: false, sortedHash: true, indexed: true });
          });
        });

        describe.skip('Unbalanced (TODO)', () => {});

        describe('Balanced/Unbalanced Overlapping Cases', () => {
          it('should use a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
            testMultiUpdate(8, [5, 4, 1], { unbalanced: true, sortedHash: false, indexed: true });
          });

          it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
            testMultiUpdate(8, [5, 4, 1], { unbalanced: true, sortedHash: true, indexed: true });
          });
        });
      });

      describe('Index and Existence Multi Proof Update Consecutive Uses', () => {
        describe('Balanced', () => {
          it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
            testConsecutiveMultiUpdate(100, 16, 6, { unbalanced: false, sortedHash: false, indexed: true });
          });

          it('should use 100 Multi Proofs for a 16-element sorted-hash Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
            testConsecutiveMultiUpdate(100, 16, 6, { unbalanced: false, sortedHash: true, indexed: true });
          });
        });

        describe.skip('Unbalanced (TODO)', () => {});
      });
    });

    describe('Existence-Only Multi Proofs', () => {
      describe('Existence-Only Boolean-Array Multi Proofs', () => {
        describe('Existence-Only Boolean-Array Multi Proof Generation', () => {
          describe('Balanced', () => {
            it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const expected = {
                decommitments: [
                  '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
                  'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                  'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
                ],
                flags: [true, false, false, false, true],
                skips: [false, false, false, false, false],
              };

              testMultiProofGeneration(8, 'ff', [5, 4, 1], expected, options);
            });

            it('should generate a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false };
              const expected = {
                decommitments: [],
                flags: [],
                skips: [],
              };

              testMultiProofGeneration(1, 'ff', [0], expected, options);
            });
          });

          describe('Unbalanced', () => {
            it('should generate a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const expected = {
                decommitments: [
                  '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
                  'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
                  'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
                  'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
                ],
                flags: [false, false, true, true, false, false, false, true],
                skips: [false, false, false, false, false, true, false, false],
              };

              testMultiProofGeneration(12, 'ff', [11, 8, 3, 2], expected, options);
            });

            it('should generate a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false };
              const expected = {
                decommitments: [
                  '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
                  '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
                  'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
                  '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
                  'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
                  'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
                  'c83c0742945e25d8ea750b433deb383bd3c68c5e415398cb3a1bf7ebd760fe85',
                  '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
                  'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                  'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
                ],
                flags: [
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  true,
                  true,
                  false,
                  true,
                  true,
                ],
                skips: [
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  false,
                  true,
                  false,
                  false,
                  true,
                  false,
                  false,
                ],
              };

              testMultiProofGeneration(19, 'ff', [17, 12, 9, 4, 2], expected, options);
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should generate the same Multi Proof for a 8-element Merkle Tree.', () => {
              const balancedOptions = { unbalanced: false, sortedHash: false, indexed: false };
              const unbalancedOptions = { unbalanced: true, sortedHash: false, indexed: false };
              compareMultiProofs(8, [5, 4, 1], balancedOptions, unbalancedOptions);
            });

            it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
              const balancedOptions = { unbalanced: false, sortedHash: true, indexed: false };
              const unbalancedOptions = { unbalanced: true, sortedHash: true, indexed: false };
              compareMultiProofs(8, [5, 4, 1], balancedOptions, unbalancedOptions);
            });
          });
        });

        describe('Existence-Only Boolean-Array Multi Proof Verification', () => {
          describe('Balanced', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
              testMultiProofVerification(8, [5, 4, 1], { unbalanced: false, sortedHash: true, indexed: false });
            });

            it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              testMultiProofVerification(1, [0], { unbalanced: false, sortedHash: true, indexed: false });
            });
          });

          describe('Unbalanced', () => {
            it('should verify a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
              testMultiProofVerification(12, [11, 8, 3, 0], { unbalanced: true, sortedHash: true, indexed: false });
            });

            it('should verify a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
              testMultiProofVerification(19, [17, 12, 9, 4, 2], { unbalanced: true, sortedHash: true, indexed: false });
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
              testMultiProofVerification(8, [5, 4, 1], { unbalanced: true, sortedHash: true, indexed: false });
            });
          });
        });

        describe('Existence-Only Boolean-Array Multi Proof Update', () => {
          describe('Balanced', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, to update elements.', () => {
              testMultiUpdate(8, [5, 4, 1], { unbalanced: false, sortedHash: true, indexed: false });
            });

            it('should use a Multi Proof for a sorted-hash 1-element Merkle Tree, to update elements.', () => {
              testMultiUpdate(1, [0], { unbalanced: false, sortedHash: true, indexed: false });
            });
          });

          describe('Unbalanced', () => {
            it('should use a Multi Proof for a sorted-hash 12-element Merkle Tree, to update elements.', () => {
              testMultiUpdate(12, [11, 8, 3, 0], { unbalanced: true, sortedHash: true, indexed: false });
            });

            it('should use a Multi Proof for a sorted-hash 19-element Merkle Tree, to update elements.', () => {
              testMultiUpdate(19, [17, 12, 9, 4, 2], { unbalanced: true, sortedHash: true, indexed: false });
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update elements.', () => {
              testMultiUpdate(8, [5, 4, 1], { unbalanced: true, sortedHash: true, indexed: false });
            });
          });
        });

        describe('Existence-Only Boolean-Array Multi Proof Update Consecutive Uses', () => {
          describe('Balanced', () => {
            it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
              testConsecutiveMultiUpdate(100, 16, 6, { unbalanced: false, sortedHash: true, indexed: false });
            });
          });

          describe('Unbalanced', () => {
            it('should use 100 Multi Proofs for a 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
              testConsecutiveMultiUpdate(100, 19, 6, { unbalanced: true, sortedHash: true, indexed: false });
            });
          });
        });
      });

      describe('Existence-Only Boolean-Bit Multi Proofs', () => {
        describe('Existence-Only Boolean-Bit Multi Proof Generation', () => {
          describe('Balanced', () => {
            it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              const expected = {
                decommitments: [
                  '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
                  'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                  'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
                ],
                flags: '0000000000000000000000000000000000000000000000000000000000000031',
                skips: '0000000000000000000000000000000000000000000000000000000000000020',
              };

              testMultiProofGeneration(8, 'ff', [5, 4, 1], expected, options);
            });

            it('should generate a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              const expected = {
                decommitments: [],
                flags: '0000000000000000000000000000000000000000000000000000000000000001',
                skips: '0000000000000000000000000000000000000000000000000000000000000001',
              };

              testMultiProofGeneration(1, 'ff', [0], expected, options);
            });
          });

          describe('Unbalanced', () => {
            it('should generate a Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              const expected = {
                decommitments: [],
                flags: '000000000000000000000000000000000000000000000000000000000000000e',
                skips: '0000000000000000000000000000000000000000000000000000000000000009',
              };

              testMultiProofGeneration(3, 'ff', [2, 1, 0], expected, options);
            });

            it('should generate a Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              const expected = {
                decommitments: ['0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60'],
                flags: '000000000000000000000000000000000000000000000000000000000000000c',
                skips: '0000000000000000000000000000000000000000000000000000000000000009',
              };

              testMultiProofGeneration(3, 'ff', [2, 1], expected, options);
            });

            it('should generate a Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              const expected = {
                decommitments: ['a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27'],
                flags: '0000000000000000000000000000000000000000000000000000000000000004',
                skips: '0000000000000000000000000000000000000000000000000000000000000005',
              };

              testMultiProofGeneration(3, 'ff', [2], expected, options);
            });

            it('should generate a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              const expected = {
                decommitments: [
                  '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
                  'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
                  'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
                  'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
                ],
                flags: '000000000000000000000000000000000000000000000000000000000000018c',
                skips: '0000000000000000000000000000000000000000000000000000000000000120',
              };

              testMultiProofGeneration(12, 'ff', [11, 8, 3, 2], expected, options);
            });

            it('should generate a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              const expected = {
                decommitments: [
                  '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
                  '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
                  'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
                  '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
                  'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
                  'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
                  'c83c0742945e25d8ea750b433deb383bd3c68c5e415398cb3a1bf7ebd760fe85',
                  '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
                  'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
                  'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
                ],
                flags: '000000000000000000000000000000000000000000000000000000000001d800',
                skips: '0000000000000000000000000000000000000000000000000000000000012400',
              };

              testMultiProofGeneration(19, 'ff', [17, 12, 9, 4, 2], expected, options);
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should generate the same Multi Proof for a 8-element Merkle Tree.', () => {
              const balancedOptions = { unbalanced: false, sortedHash: false, indexed: false, bitFlags: true };
              const unbalancedOptions = { unbalanced: true, sortedHash: false, indexed: false, bitFlags: true };
              compareMultiProofs(8, [5, 4, 1], balancedOptions, unbalancedOptions);
            });

            it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
              const balancedOptions = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              const unbalancedOptions = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              compareMultiProofs(8, [5, 4, 1], balancedOptions, unbalancedOptions);
            });
          });
        });

        describe('Existence-Only Boolean-Bit Multi Proof Verification', () => {
          describe('Balanced', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              testMultiProofVerification(8, [5, 4, 1], options);
            });

            it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              testMultiProofVerification(1, [0], options);
            });
          });

          describe('Unbalanced', () => {
            it('should verify a Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiProofVerification(3, [2, 1, 0], options);
            });

            it('should verify a Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiProofVerification(3, [2, 1], options);
            });

            it('should verify a Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiProofVerification(3, [2], options);
            });

            it('should verify a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiProofVerification(12, [11, 8, 3, 2], options);
            });

            it('should verify a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiProofVerification(19, [17, 12, 9, 4, 2], options);
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiProofVerification(8, [5, 4, 1], options);
            });
          });
        });

        describe('Existence-Only Boolean-Bit Multi Proof Update', () => {
          describe('Balanced', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, to update elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              testMultiUpdate(8, [5, 4, 1], options);
            });

            it('should use a Multi Proof for a sorted-hash 1-element Merkle Tree, to update elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              testMultiUpdate(1, [0], options);
            });
          });

          describe('Unbalanced', () => {
            it('should use a Multi Proof for a sorted-hash 3-element Merkle Tree, to update elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiUpdate(3, [2, 1, 0], options);
            });

            it('should use a Multi Proof for a sorted-hash 3-element Merkle Tree, to update elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiUpdate(3, [2, 1], options);
            });

            it('should use a Multi Proof for a sorted-hash 3-element Merkle Tree, to update elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiUpdate(3, [2], options);
            });

            it('should use a Multi Proof for a sorted-hash 12-element Merkle Tree, to update elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiUpdate(12, [11, 8, 3, 0], options);
            });

            it('should use a Multi Proof for a sorted-hash 19-element Merkle Tree, to update elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiUpdate(19, [17, 12, 9, 4, 2], options);
            });
          });

          describe('Balanced/Unbalanced Overlapping Cases', () => {
            it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testMultiUpdate(8, [5, 4, 1], options);
            });
          });
        });

        describe('Existence-Only Boolean-Bit Multi Proof Update Consecutive Uses', () => {
          describe('Balanced', () => {
            it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
              const options = { unbalanced: false, sortedHash: true, indexed: false, bitFlags: true };
              testConsecutiveMultiUpdate(100, 16, 6, options);
            });
          });

          describe('Unbalanced', () => {
            it('should use 100 Multi Proofs for a 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testConsecutiveMultiUpdate(100, 19, 6, options);
            });

            it('should use 50 Multi Proofs for a 89-element Merkle Tree, to perform 50 updates of up to 13 random elements.', () => {
              const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
              testConsecutiveMultiUpdate(50, 89, 13, options);
            });
          });
        });
      });
    });
  });

  describe('Append Proofs', () => {
    describe('Append Proof Generation', () => {
      it('should generate an Append Proof for a 1-element Merkle Tree.', () => {
        const expected = {
          decommitments: ['0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60'],
        };

        testAppendProofGeneration(1, 'ff', expected, { unbalanced: true, sortedHash: false });
      });

      it('should generate an Append Proof for a 2-element Merkle Tree.', () => {
        const expected = {
          decommitments: ['a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27'],
        };

        testAppendProofGeneration(2, 'ff', expected, { unbalanced: true, sortedHash: false });
      });

      it('should generate an Append Proof for a 3-element Merkle Tree.', () => {
        const expected = {
          decommitments: [
            'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b',
          ],
        };

        testAppendProofGeneration(3, 'ff', expected, { unbalanced: true, sortedHash: false });
      });

      it('should generate an Append Proof for a 8-element Merkle Tree.', () => {
        const expected = {
          decommitments: ['0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4'],
        };

        testAppendProofGeneration(8, 'ff', expected, { unbalanced: true, sortedHash: false });
      });

      it('should generate an Append Proof for a 15-element Merkle Tree.', () => {
        const expected = {
          decommitments: [
            '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4',
            'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b',
            '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6',
            'e481ff292c1b323f27dd2e7b0da511947e0d349a0616a739ea628a3a5888c529',
          ],
        };

        testAppendProofGeneration(15, 'ff', expected, { unbalanced: true, sortedHash: false });
      });

      it('should generate an Append Proof for a 20-element Merkle Tree.', () => {
        const expected = {
          decommitments: [
            'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be',
            'febc2d558e22b7e32db3a5dd0b4d8ac3dac5835493955c53e3eb0f8fdb2f4954',
          ],
        };

        testAppendProofGeneration(20, 'ff', expected, { unbalanced: true, sortedHash: false });
      });
    });

    describe('Append Proof Verification', () => {
      it('should verify an Append Proof for a 1-element Merkle Tree.', () => {
        testAppendProofVerification(1, { unbalanced: true, sortedHash: false });
      });

      it('should verify an Append Proof for a 2-element Merkle Tree.', () => {
        testAppendProofVerification(2, { unbalanced: true, sortedHash: false });
      });

      it('should verify an Append Proof for a 3-element Merkle Tree.', () => {
        testAppendProofVerification(3, { unbalanced: true, sortedHash: false });
      });

      it('should verify an Append Proof for a 8-element Merkle Tree.', () => {
        testAppendProofVerification(8, { unbalanced: true, sortedHash: false });
      });

      it('should verify an Append Proof for a 15-element Merkle Tree.', () => {
        testAppendProofVerification(15, { unbalanced: true, sortedHash: false });
      });

      it('should verify an Append Proof for a 20-element Merkle Tree.', () => {
        testAppendProofVerification(20, { unbalanced: true, sortedHash: false });
      });

      it('should verify an Append Proof for a 1-element sorted-hash Merkle Tree.', () => {
        testAppendProofVerification(1, { unbalanced: true, sortedHash: true });
      });

      it('should verify an Append Proof for a 2-element sorted-hash Merkle Tree.', () => {
        testAppendProofVerification(2, { unbalanced: true, sortedHash: true });
      });

      it('should verify an Append Proof for a 3-element sorted-hash Merkle Tree.', () => {
        testAppendProofVerification(3, { unbalanced: true, sortedHash: true });
      });

      it('should verify an Append Proof for a 8-element sorted-hash Merkle Tree.', () => {
        testAppendProofVerification(8, { unbalanced: true, sortedHash: true });
      });

      it('should verify an Append Proof for a 15-element sorted-hash Merkle Tree.', () => {
        testAppendProofVerification(15, { unbalanced: true, sortedHash: true });
      });

      it('should verify an Append Proof for a 20-element sorted-hash Merkle Tree.', () => {
        testAppendProofVerification(20, { unbalanced: true, sortedHash: true });
      });
    });

    describe('Append Proof Single Append', () => {
      it('should use an Append Proof for a 1-element Merkle Tree, to append an element.', () => {
        testSingleAppend(1, { unbalanced: true, sortedHash: false });
      });

      it('should use an Append Proof for a 2-element Merkle Tree, to append an element.', () => {
        testSingleAppend(2, { unbalanced: true, sortedHash: false });
      });

      it('should use an Append Proof for a 3-element Merkle Tree, to append an element.', () => {
        testSingleAppend(3, { unbalanced: true, sortedHash: false });
      });

      it('should use an Append Proof for a 8-element Merkle Tree, to append an element.', () => {
        testSingleAppend(8, { unbalanced: true, sortedHash: false });
      });

      it('should use an Append Proof for a 15-element Merkle Tree, to append an element.', () => {
        testSingleAppend(15, { unbalanced: true, sortedHash: false });
      });

      it('should use an Append Proof for a 20-element Merkle Tree, to append an element.', () => {
        testSingleAppend(20, { unbalanced: true, sortedHash: false });
      });

      it('should use an Append Proof for a 1-element sorted-hash Merkle Tree, to append an element.', () => {
        testSingleAppend(1, { unbalanced: true, sortedHash: true });
      });

      it('should use an Append Proof for a 2-element sorted-hash Merkle Tree, to append an element.', () => {
        testSingleAppend(2, { unbalanced: true, sortedHash: true });
      });

      it('should use an Append Proof for a 3-element sorted-hash Merkle Tree, to append an element.', () => {
        testSingleAppend(3, { unbalanced: true, sortedHash: true });
      });

      it('should use an Append Proof for a 8-element sorted-hash Merkle Tree, to append an element.', () => {
        testSingleAppend(8, { unbalanced: true, sortedHash: true });
      });

      it('should use an Append Proof for a 15-element sorted-hash Merkle Tree, to append an element.', () => {
        testSingleAppend(15, { unbalanced: true, sortedHash: true });
      });

      it('should use an Append Proof for a 20-element sorted-hash Merkle Tree, to append an element.', () => {
        testSingleAppend(20, { unbalanced: true, sortedHash: true });
      });
    });

    describe('Append Proof Single Append Consecutive Uses', () => {
      it('should use 100 Append Proofs for a 15-element Merkle Tree, to append an 100 elements consecutively.', () => {
        testConsecutiveSingleAppend(100, 15, { unbalanced: true, sortedHash: false });
      });
    });

    describe('Append Proof Multi Append', () => {
      it('should use a Multi Append Proof for a 1-element Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(1, 5, { unbalanced: true, sortedHash: false });
      });

      it('should use a Multi Append Proof for a 2-element Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(2, 5, { unbalanced: true, sortedHash: false });
      });

      it('should use a Multi Append Proof for a 3-element Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(3, 5, { unbalanced: true, sortedHash: false });
      });

      it('should use a Multi Append Proof for a 8-element Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(8, 5, { unbalanced: true, sortedHash: false });
      });

      it('should use a Multi Append Proof for a 15-element Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(15, 5, { unbalanced: true, sortedHash: false });
      });

      it('should use a Multi Append Proof for a 19-element Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(19, 5, { unbalanced: true, sortedHash: false });
      });

      it('should use a Multi Append Proof for a 20-element Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(20, 5, { unbalanced: true, sortedHash: false });
      });

      it('should use a Multi Append Proof for a 49-element Merkle Tree, to append 17 elements.', () => {
        testMultiAppend(49, 17, { unbalanced: true, sortedHash: false });
      });

      it('should use a Multi Append Proof for a 120-element Merkle Tree, to append 8 elements.', () => {
        testMultiAppend(120, 8, { unbalanced: true, sortedHash: false });
      });

      it('should use a Multi Append Proof for a 1-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(1, 5, { unbalanced: true, sortedHash: true });
      });

      it('should use a Multi Append Proof for a 2-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(2, 5, { unbalanced: true, sortedHash: true });
      });

      it('should use a Multi Append Proof for a 3-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(3, 5, { unbalanced: true, sortedHash: true });
      });

      it('should use a Multi Append Proof for a 8-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(8, 5, { unbalanced: true, sortedHash: true });
      });

      it('should use a Multi Append Proof for a 15-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(15, 5, { unbalanced: true, sortedHash: true });
      });

      it('should use a Multi Append Proof for a sorted-hash 19-element Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(19, 5, { unbalanced: true, sortedHash: true });
      });

      it('should use a Multi Append Proof for a sorted-hash 20-element Merkle Tree, to append 5 elements.', () => {
        testMultiAppend(20, 5, { unbalanced: true, sortedHash: true });
      });

      it('should use a Multi Append Proof for a sorted-hash 49-element Merkle Tree, to append 17 elements.', () => {
        testMultiAppend(49, 17, { unbalanced: true, sortedHash: true });
      });

      it('should use a Multi Append Proof for a sorted-hash 120-element Merkle Tree, to append 8 elements.', () => {
        testMultiAppend(120, 8, { unbalanced: true, sortedHash: true });
      });
    });

    describe('Append Proof Multi Append Consecutive Uses', () => {
      it('should use 100 Multi Append Proofs for a 1-element Merkle Tree, to perform 100 appends of up to 6 random elements.', () => {
        testConsecutiveMultiAppend(100, 1, 6, { unbalanced: true, sortedHash: false });
      });

      it('should use 50 Multi Append Proofs for a 7-element sorted-hash Merkle Tree, to perform 50 appends of up to 11 random elements.', () => {
        testConsecutiveMultiAppend(50, 7, 11, { unbalanced: true, sortedHash: true });
      });
    });
  });

  describe('Combined Proof (Multi Proofs with Append Proofs)', () => {
    describe('Get Minimum Element Index for Combined Proof', () => {
      it('should get the minimum element index to be included in a Combined Proof a 1-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(1, { minimumIndex: 0 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 2-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(2, { minimumIndex: 0 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 3-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(3, { minimumIndex: 2 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 4-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(4, { minimumIndex: 0 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 5-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(5, { minimumIndex: 4 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 6-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(6, { minimumIndex: 4 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 7-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(7, { minimumIndex: 6 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 8-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(8, { minimumIndex: 0 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 23-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(23, { minimumIndex: 22 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 48-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(48, { minimumIndex: 32 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 365-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(365, { minimumIndex: 364 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 384-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(384, { minimumIndex: 256 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 580-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(580, { minimumIndex: 576 }, { unbalanced: true });
      });

      it('should get the minimum element index to be included in a Combined Proof a 1792-element Merkle Tree.', () => {
        testCombinedProofMinimumIndex(1792, { minimumIndex: 1536 }, { unbalanced: true });
      });
    });

    describe('Boolean-Array Combined Proofs', () => {
      describe('Boolean-Array Combined Proof Generation', () => {
        it('should verify a Combined Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(1, 'ff', [0], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(2, 'ff', [1], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(2, 'ff', [1, 0], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(128, 'ff', [127, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(128, 'ff', [127, 126, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(100, 'ff', [99], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(100, 'ff', [99, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(100, 'ff', [99, 98, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(100, 'ff', [99, 97, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(100, 'ff', [99, 98, 97, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(101, 'ff', [100], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(101, 'ff', [100, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(101, 'ff', [100, 99, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(101, 'ff', [100, 98, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(101, 'ff', [100, 99, 98, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(12, 'ff', [11, 7], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(12, 'ff', [10, 7], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(12, 'ff', [9, 7], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofGeneration(12, 'ff', [8, 7], 5, options);
        });
      });

      describe('Boolean-Array Combined Proof Verification', () => {
        it('should verify a Combined Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(1, [0], options);
        });

        it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(2, [1], options);
        });

        it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(2, [1, 0], options);
        });

        it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(128, [127, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(128, [127, 126, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(100, [99], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(100, [99, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(100, [99, 98, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(100, [99, 97, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(100, [99, 98, 97, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(101, [100], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(101, [100, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(101, [100, 99, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(101, [100, 98, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(101, [100, 99, 98, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(12, [11, 7], options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(12, [10, 7], options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(12, [9, 7], options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedProofVerification(12, [8, 7], options);
        });
      });

      describe('Boolean-Array Combined Proof Update and Append', () => {
        it('should use a Combined Proof for a sorted-hash 1-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(1, [0], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(2, [1], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(2, [1, 0], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(128, [127, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(128, [127, 126, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(100, [99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(100, [99, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(100, [99, 98, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(100, [99, 97, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(100, [99, 98, 97, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(101, [100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(101, [100, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(101, [100, 99, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(101, [100, 98, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(101, [100, 99, 98, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(12, [11, 7], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(12, [10, 7], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(12, [9, 7], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: false };
          testCombinedUpdateAndAppend(12, [8, 7], 5, options);
        });
      });

      describe('Boolean-Array Combined Proof Update an Append Consecutive Uses', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 updates and appends of up to 6 random elements respectively.', () => {
          testConsecutiveUpdateAndAppend(100, 1, 6, 6, { unbalanced: true, sortedHash: true, indexed: false });
        });

        it('should use 50 Combined Proofs for a 3-element Merkle Tree, to perform 50 updates and appends of up to 12 random elements respectively.', () => {
          testConsecutiveUpdateAndAppend(50, 3, 12, 12, { unbalanced: true, sortedHash: true, indexed: false });
        });
      });
    });

    describe('Boolean-Bit Combined Proofs', () => {
      describe('Boolean-Bit Combined Proof Generation', () => {
        it('should verify a Combined Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(1, 'ff', [0], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(2, 'ff', [1], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(2, 'ff', [1, 0], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(128, 'ff', [127, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(128, 'ff', [127, 126, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(100, 'ff', [99], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(100, 'ff', [99, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(100, 'ff', [99, 98, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(100, 'ff', [99, 97, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(100, 'ff', [99, 98, 97, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(101, 'ff', [100], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(101, 'ff', [100, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(101, 'ff', [100, 99, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(101, 'ff', [100, 98, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(101, 'ff', [100, 99, 98, 15, 12, 4, 2], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(12, 'ff', [11, 7], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(12, 'ff', [10, 7], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(12, 'ff', [9, 7], 5, options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofGeneration(12, 'ff', [8, 7], 5, options);
        });
      });

      describe('Boolean-Bit Combined Proof Verification', () => {
        it('should verify a Combined Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(1, [0], options);
        });

        it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(2, [1], options);
        });

        it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(2, [1, 0], options);
        });

        it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(128, [127, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(128, [127, 126, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(100, [99], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(100, [99, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(100, [99, 98, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(100, [99, 97, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(100, [99, 98, 97, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(101, [100], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(101, [100, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(101, [100, 99, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(101, [100, 98, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(101, [100, 99, 98, 15, 12, 4, 2], options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(12, [11, 7], options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(12, [10, 7], options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(12, [9, 7], options);
        });

        it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedProofVerification(12, [8, 7], options);
        });
      });

      describe('Boolean-Bit Combined Proof Update and Append', () => {
        it('should use a Combined Proof for a sorted-hash 1-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(1, [0], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(2, [1], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(2, [1, 0], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(128, [127, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(128, [127, 126, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(100, [99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(100, [99, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(100, [99, 98, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(100, [99, 97, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(100, [99, 98, 97, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(101, [100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(101, [100, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(101, [100, 99, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(101, [100, 98, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(101, [100, 99, 98, 15, 12, 4, 2], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(12, [11, 7], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(12, [10, 7], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(12, [9, 7], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, bitFlags: true };
          testCombinedUpdateAndAppend(12, [8, 7], 5, options);
        });
      });

      describe('Boolean-Bit Combined Proof Update an Append Consecutive Uses', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 updates and appends of up to 6 random elements respectively.', () => {
          testConsecutiveUpdateAndAppend(100, 1, 6, 6, {
            unbalanced: true,
            sortedHash: true,
            indexed: false,
            bitFlags: true,
          });
        });

        it('should use 50 Combined Proofs for a 3-element Merkle Tree, to perform 50 updates and appends of up to 12 random elements respectively.', () => {
          testConsecutiveUpdateAndAppend(50, 3, 12, 12, {
            unbalanced: true,
            sortedHash: true,
            indexed: false,
            bitFlags: true,
          });
        });
      });
    });
  });
});
