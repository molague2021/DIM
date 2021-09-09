import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  DestinyFactionDefinition,
  DestinyProgression,
  DestinyVendorComponent,
} from 'bungie-api-ts/destiny2';
import React from 'react';
import { bungieNetPath } from '../dim-ui/BungieImage';
import CircleProgress from '../dim-ui/CircleProgress';
import DiamondProgress from '../dim-ui/DiamondProgress';
import styles from './FactionIcon.m.scss';

export default function FactionIcon(props: {
  defs: D2ManifestDefinitions;
  factionProgress: DestinyProgression;
  factionDef: DestinyFactionDefinition;
  vendor?: DestinyVendorComponent;
}) {
  const { factionProgress, factionDef, vendor, defs } = props;
  const level = vendor?.seasonalRank ?? factionProgress.level;
  const progressionType = vendor?.vendorHash
    ? defs.Vendor.get(vendor.vendorHash).vendorProgressionType ?? 0
    : 0;
  const icon2 = vendor?.vendorHash
    ? defs.Vendor.get(vendor.vendorHash).displayProperties.smallTransparentIcon ?? undefined
    : undefined;

  if (progressionType === 1) {
    return (
      <CircleProgress
        icon={bungieNetPath(factionDef.displayProperties.icon)}
        icon2={icon2 && bungieNetPath(icon2)}
        level={level}
        className={styles.factionIcon}
        progress={factionProgress.progressToNextLevel / factionProgress.nextLevelAt}
      />
    );
  }
  return (
    <DiamondProgress
      icon={bungieNetPath(factionDef.displayProperties.icon)}
      level={level}
      className={styles.factionIcon}
      progress={factionProgress.progressToNextLevel / factionProgress.nextLevelAt}
    />
  );
}
