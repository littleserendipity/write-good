const writeGood = require('../write-good');

describe('writeGood', () => {
  it('should detect weasel words', () => {
    expect(writeGood('Remarkably few developers write well.')).toEqual([
      { index: 0, offset: 10, reason: '"Remarkably" is a weasel word and can weaken meaning' },
      { index: 11, offset: 3, reason: '"few" is a weasel word' }
    ]);
  });

  it('should detect passive voice', () => {
    expect(writeGood('The script was killed')).toEqual([
      { index: 11, offset: 10, reason: '"was killed" may be passive voice' }
    ]);
  });

  it('should not detect passive voice if that check is disabled', () => {
    expect(writeGood('The script was killed', { passive: false })).toEqual([]);
  });

  it('should detect lexical illusions', () => {
    expect(writeGood('the the')).toEqual([
      { index: 4, offset: 3, reason: '"the" is repeated' }
    ]);
  });

  it('should not detect lexical illusions if that check is disabled', () => {
    expect(writeGood('the the', { illusion: false })).toEqual([]);
  });

  it('should detect lexical illusions with line breaks', () => {
    expect(writeGood('the\nthe')).toEqual([
      { index: 4, offset: 3, reason: '"the" is repeated' }
    ]);
  });

  it('should detect lexical illusions with case insensitivity', () => {
    expect(writeGood('The the')).toEqual([
      { index: 4, offset: 3, reason: '"the" is repeated' }
    ]);
  });

  it('should not detect lexical illusions for non-words', () => {
    expect(writeGood('// //')).toEqual([]);
  });

  it('should detect sentences that start with "so"', () => {
    expect(writeGood('So the best thing to do is wait.')).toEqual([
      { index: 0, offset: 2, reason: '"So" adds no meaning' }
    ]);
  });

  it('should not detect sentences that start with "so" if that check is disabled', () => {
    expect(writeGood('So the best thing to do is wait.', { so: false })).toEqual([]);
  });

  it('should not detect "So?"', () => {
    expect(writeGood('So?')).toEqual([]);
  });

  it('should not detect "so" in the middle of a sentence', () => {
    expect(writeGood('This changes the code so that it works.')).toEqual([]);
  });

  it('should not detect words starting with "so"', () => {
    expect(writeGood('Some silly sausages start sentences stating so.')).toEqual([]);
    expect(writeGood('Sorry, everyone.')).toEqual([]);
  });

  it('should detect clauses after a semicolon that start with "so"', () => {
    expect(writeGood('This is a test; so it should pass or fail.')).toEqual([
      { index: 16, offset: 2, reason: '"so" adds no meaning' }
    ]);
  });

  it('should detect sentences starting with "there is"', () => {
    expect(writeGood('There is a use for this construction.')).toEqual([
      { index: 0, offset: 8, reason: '"There is" is unnecessary verbiage' }
    ]);
  });

  it('should detect sentences starting with "there are"', () => {
    expect(writeGood('There are uses for this construction.')).toEqual([
      { index: 0, offset: 9, reason: '"There are" is unnecessary verbiage' }
    ]);
  });

  it('should detect sentences with common adverbs', () => {
    expect(writeGood('This sentence is simply terrible')).toEqual([
      { index: 17, offset: 6, reason: '"simply" can weaken meaning' }
    ]);
  });

  it('should fail validation once for terms that trigger multiple suggestions', () => {
    expect(writeGood('This sentence is extremely good.')).toEqual([
      { index: 17, offset: 9, reason: '"extremely" is a weasel word and can weaken meaning' }
    ]);
  });

  it('should order suggestions by index', () => {
    expect(writeGood('It has been said that few developers write well.')).toEqual([
      { index: 7, offset: 9, reason: '"been said" may be passive voice' },
      { index: 22, offset: 3, reason: '"few" is a weasel word' }
    ]);
  });

  it('should detect wordy phrases', () => {
    expect(writeGood('As a matter of fact, this sentence could be simpler.')).toEqual([
      { index: 0, offset: 19, reason: '"As a matter of fact" is wordy or unneeded' }
    ]);
  });

  it('should detect complex words', () => {
    expect(writeGood('Your readers will be adversely impacted by this sentence.')).toEqual([
      { index: 31, offset: 8, reason: '"impacted" is wordy or unneeded' }
    ]);
  });

  it('should detect common cliches', () => {
    expect(writeGood('Writing specs puts me at loose ends.')).toEqual([
      { index: 22, offset: 13, reason: '"at loose ends" is a cliche' }
    ]);
  });

  it('should have no suggestions for an empty string', () => {
    expect(writeGood('')).toEqual([]);
  });

  it('should handle leading newlines on "so" detection.', () => {
    expect(writeGood('\n\nSo adds no meaning.')).toEqual([
      { index: 2, offset: 2, reason: '"So" adds no meaning' }
    ]);
  });

  it('should handle leading newlines on "there is" detection.', () => {
    expect(writeGood('\n\nthere is unnecessary verbiage.')).toEqual([
      { index: 2, offset: 8, reason: '"there is" is unnecessary verbiage' }
    ]);
  });

  it('should detect simple "to be" verb', () => {
    expect(writeGood('NodeJs is awesome ;)', { eprime: true })).toEqual([
      { index: 7, offset: 2, reason: '"is" is a form of \'to be\'' }
    ]);
  });

  it('should ignore "to be" verb with check disabled', () => {
    expect(writeGood('NodeJs is awesome ;)', { eprime: false })).toEqual([]);
  });

  it('should detect "to be" verb contraction', () => {
    expect(writeGood('There\'s no place like localhost', { eprime: true })).toEqual([
      { index: 0, offset: 7, reason: '"There\'s" is a form of \'to be\'' }
    ]);
  });

  it('shouldn\'t flag words starting with "is" as an error', () => {
    expect(writeGood('Isle of Man', { eprime: true })).toEqual([]);
  });
});

describe('annotate', () => {
  const { annotate } = writeGood;

  it('should detect weasel words', () => {
    const text = 'Remarkably few developers write well.';
    const suggestions = writeGood(text);
    const annotations = annotate(text, suggestions);

    expect(annotations[0]).toBe(
      'Remarkably few developers write well.\n'
      + '^^^^^^^^^^\n'
      + '"Remarkably" is a weasel word and can weaken meaning on line 1 at column 0'
    );

    expect(annotations[1]).toBe(
      'Remarkably few developers write well.\n'
      + '           ^^^\n'
      + '"few" is a weasel word on line 1 at column 11'
    );
  });
});
