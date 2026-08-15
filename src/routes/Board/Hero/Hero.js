// Copyright (C) 2017-2026 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useTranslation } = require('react-i18next');
const { Button } = require('stremio/components');
const styles = require('./styles');

// Featured banner over the board rows, after Disclaw Filmes. Everything it
// shows comes from the catalog item itself — Cinemeta previews already carry
// background, logo, description and runtime — so it costs no extra request.
const Hero = ({ className, item }) => {
    const { t } = useTranslation();

    const playHref = item?.deepLinks?.metaDetailsStreams ?? null;
    const infoHref = item?.deepLinks?.metaDetailsVideos ?? item?.deepLinks?.metaDetailsStreams ?? null;

    const background = React.useMemo(() => (
        typeof item?.background === 'string' && item.background.length > 0 ?
            { backgroundImage: `url(${JSON.stringify(item.background)})` }
            :
            undefined
    ), [item]);

    if (!item) return null;

    return (
        <div className={classnames(className, styles['hero-container'])} style={background}>
            <div className={styles['hero-content']}>
                {
                    typeof item.logo === 'string' && item.logo.length > 0 ?
                        <img className={styles['logo']} src={item.logo} alt={item.name} />
                        :
                        <h1 className={styles['title']}>{item.name}</h1>
                }
                <div className={styles['meta']}>
                    {
                        typeof item.releaseInfo === 'string' && item.releaseInfo.length > 0 ?
                            <span>{item.releaseInfo}</span>
                            :
                            null
                    }
                    {
                        typeof item.runtime === 'string' && item.runtime.length > 0 ?
                            <span>{item.runtime}</span>
                            :
                            null
                    }
                </div>
                {
                    typeof item.description === 'string' && item.description.length > 0 ?
                        <p className={styles['description']}>{item.description}</p>
                        :
                        null
                }
                <div className={styles['actions']}>
                    {
                        playHref !== null ?
                            <Button className={classnames(styles['button'], styles['primary'])} href={playHref} tabIndex={-1}>
                                {t('DISCLAW_HERO_PLAY')}
                            </Button>
                            :
                            null
                    }
                    {
                        infoHref !== null ?
                            <Button className={classnames(styles['button'], styles['secondary'])} href={infoHref} tabIndex={-1}>
                                {t('DISCLAW_HERO_INFO')}
                            </Button>
                            :
                            null
                    }
                </div>
            </div>
        </div>
    );
};

Hero.propTypes = {
    className: PropTypes.string,
    item: PropTypes.shape({
        name: PropTypes.string,
        logo: PropTypes.string,
        background: PropTypes.string,
        description: PropTypes.string,
        releaseInfo: PropTypes.string,
        runtime: PropTypes.string,
        deepLinks: PropTypes.shape({
            metaDetailsVideos: PropTypes.string,
            metaDetailsStreams: PropTypes.string,
        }),
    }),
};

module.exports = Hero;
