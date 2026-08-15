// Copyright (C) 2017-2026 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { Link } = require('react-router-dom');
const { useTranslation } = require('react-i18next');
const { default: Icon } = require('@stremio/stremio-icons/react');
const styles = require('./styles');

// The route tabs as inline text links in the top bar, the way Disclaw Filmes
// lays out its navigation. Deliberately not the vertical rail's NavTabButton:
// that one is styled for a stacked icon-over-label rail and fighting it from
// the outside costs more than these few lines.
const NavTabs = ({ className, tabs, selected }) => {
    const { t } = useTranslation();

    if (!Array.isArray(tabs)) return null;

    return (
        <div className={classnames(className, styles['nav-tabs-container'])}>
            {tabs.map((tab) => (
                <Link
                    key={tab.id}
                    className={classnames(styles['nav-tab'], { [styles['selected']]: tab.id === selected })}
                    to={tab.href}
                    title={t(tab.label)}
                    tabIndex={-1}
                    onClick={tab.onClick}
                >
                    <Icon className={styles['icon']} name={tab.id === selected ? tab.icon : `${tab.icon}-outline`} />
                    <span className={styles['label']}>{t(tab.label)}</span>
                </Link>
            ))}
        </div>
    );
};

NavTabs.propTypes = {
    className: PropTypes.string,
    selected: PropTypes.string,
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        icon: PropTypes.string,
        href: PropTypes.string,
        onClick: PropTypes.func,
    })),
};

module.exports = NavTabs;
