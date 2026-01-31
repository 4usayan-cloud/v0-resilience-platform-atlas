import { getFallbackMarketIndices } from '../lib/api-utils';

describe('getFallbackMarketIndices', () => {
  it('should return an array of market indices with expected properties', () => {
    const indices = getFallbackMarketIndices();
    expect(Array.isArray(indices)).toBe(true);
    expect(indices.length).toBeGreaterThan(0);
    expect(indices[0]).toHaveProperty('name');
    expect(indices[0]).toHaveProperty('country');
    expect(indices[0]).toHaveProperty('value');
    expect(indices[0]).toHaveProperty('change');
    expect(indices[0]).toHaveProperty('changePercent');
    expect(indices[0]).toHaveProperty('currency');
  });
});
