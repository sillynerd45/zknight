import {ROCK_ASSETS, DECO_ASSETS} from '@/sprites/staticAssets';
import {getDecoSize} from './decoSizes';
import styles from './editorStyles.module.css';

interface WallAssetPickerProps {
    activeAsset: string;
    onSelect: (asset: string) => void;
}

const ALL_WALL_ASSETS = [...ROCK_ASSETS, ...DECO_ASSETS];

export function WallAssetPicker({activeAsset, onSelect}: WallAssetPickerProps) {
    return (
        <>
            <p className={styles.sectionLabel} style={{marginTop: 4}}>Rocks</p>
            <div className={styles.assetGrid}>
                {ROCK_ASSETS.map((asset) => (
                    <div
                        key={asset}
                        className={asset === activeAsset ? styles.assetThumbActive : styles.assetThumb}
                        style={{backgroundImage: `url('${asset}')`}}
                        onClick={() => onSelect(asset)}
                    />
                ))}
            </div>
            <p className={styles.sectionLabel} style={{marginTop: 4}}>Deco</p>
            <div className={styles.decoGrid}>
                {DECO_ASSETS.map((asset) => {
                    const size = getDecoSize(asset);
                    const tooltip = size.width === 64 && size.height === 64
                        ? undefined
                        : `${size.width}x${size.height}`;
                    return (
                        <div
                            key={asset}
                            className={asset === activeAsset ? styles.assetThumbActive : styles.assetThumb}
                            style={{backgroundImage: `url('${asset}')`}}
                            onClick={() => onSelect(asset)}
                            title={tooltip}
                        />
                    );
                })}
            </div>
        </>
    );
}
