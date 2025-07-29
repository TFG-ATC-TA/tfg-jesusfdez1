export const getRotationDuration = (encoderData: number | null | undefined) => {
  if (encoderData === null || encoderData === undefined || encoderData <= 0) return 0;
  const minDuration = 1000;
  const maxDuration = 7000;
  const minRPM = 0;
  const maxRPM = 1000;

  const rpm = Math.min(Math.max(encoderData, minRPM), maxRPM);
  const duration =
    maxDuration -
    ((rpm - minRPM) * (maxDuration - minDuration)) / (maxRPM - minRPM);

  return duration;
};

export const getAlcalineAcidCylinders = ({ quantity, maxValue }: { quantity: number; maxValue: number }) => {
  const calculateMorphTargets = (quantity: number, maxValue: number) => {
    const percentage = Math.min(quantity / maxValue, 1);
    const morph1 = percentage * 0.5;
    const morph2 = percentage * 0.3;
    const morph3 = percentage * 0.2;
    return [morph1, morph2, morph3];
  };

  const alcalineMorph = calculateMorphTargets(quantity, maxValue);
  const acidMorph = calculateMorphTargets(quantity, maxValue);

  return { alcalineMorph, acidMorph };
};

export const getVisibleMilkCilinder = (quantity: number | null | undefined) => {
  const ranges = [
    { min: 1, max: 10 },
    { min: 10, max: 20 },
    { min: 20, max: 30 },
    { min: 30, max: 40 },
    { min: 40, max: 50 },
    { min: 50, max: 60 },
    { min: 60, max: 70 },
    { min: 70, max: 80 },
    { min: 80, max: 90},
    { min: 90, max: 100},
  ];

  if (quantity == null) return null;
  const range = ranges.find(
    ({ min, max }) => quantity >= min && quantity < max
  );

  if (range) {
    return range;
  }

  return null;
}; 