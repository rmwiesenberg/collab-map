import React from 'react';

import DeckGL from '@deck.gl/react';
import {MapView} from '@deck.gl/core';
import {TileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer, PathLayer} from '@deck.gl/layers';

import type {Position, MapViewState} from '@deck.gl/core';
import {GeoJsonLayer, PickingInfo} from "deck.gl";
import type {Feature, Geometry} from 'geojson';

const DATA_URL = "https://raw.githubusercontent.com/rmwiesenberg/collab-map/refs/heads/main/data/solar.geojson";

const INITIAL_VIEW_STATE: MapViewState = {
    latitude: 44.9346984280946,
    longitude: -93.26225984401101,
    zoom: 18,
    maxZoom: 20,
    maxPitch: 89,
    bearing: 0
};

const COPYRIGHT_LICENSE_STYLE: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'hsla(0,0%,100%,.5)',
    padding: '0 5px',
    font: '12px/20px Helvetica Neue,Arial,Helvetica,sans-serif'
};

const LINK_STYLE: React.CSSProperties = {
    textDecoration: 'none',
    color: 'rgba(0,0,0,.75)',
    cursor: 'grab'
};

/* global window */
const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

type SolarProperties = {
    name: string;
};

function getTooltip(info: PickingInfo<Feature<Geometry, SolarProperties>>) {
    return info.object ?
        {
            html: `\
            <div><b>${info.object.properties.name}</b></div>
            `
        } : null;
}

export function App({
                                showBorder = false,
                                onTilesLoad
                            }: {
    showBorder?: boolean;
    onTilesLoad?: () => void;
}) {
    const dataLayer = new GeoJsonLayer<SolarProperties>({
        id: 'solar',
        data: DATA_URL,
        pointType: 'circle',
        filled: true,
        getFillColor: [0, 255, 0],
        getPointRadius: 4,
        pointRadiusMinPixels: 10,
        pickable: true
    });

    const tileLayer = new TileLayer<ImageBitmap>({
        // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
        data: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],

        // Since these OSM tiles support HTTP/2, we can make many concurrent requests
        // and we aren't limited by the browser to a certain number per domain.
        maxRequests: 20,

        pickable: false,
        onViewportLoad: onTilesLoad,
        autoHighlight: showBorder,
        highlightColor: [60, 60, 60, 40],
        // https://wiki.openstreetmap.org/wiki/Zoom_levels
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: devicePixelRatio === 1 ? -1 : 0,
        renderSubLayers: props => {
            const [[west, south], [east, north]] = props.tile.boundingBox;
            const {data, ...otherProps} = props;

            return [
                new BitmapLayer(otherProps, {
                    image: data,
                    bounds: [west, south, east, north]
                }),
                showBorder &&
                new PathLayer<Position[]>({
                    id: `${props.id}-border`,
                    data: [
                        [
                            [west, north],
                            [west, south],
                            [east, south],
                            [east, north],
                            [west, north]
                        ]
                    ],
                    getPath: d => d,
                    getColor: [255, 0, 0],
                    widthMinPixels: 4
                })
            ];
        }
    });

    return (
        <DeckGL
            layers={[tileLayer, dataLayer]}
            views={new MapView({repeat: true})}
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            getTooltip={getTooltip}
        >
            <div style={COPYRIGHT_LICENSE_STYLE}>
                {'© '}
                <a style={LINK_STYLE} href="https://www.openstreetmap.org/copyright" target="blank">
                    OpenStreetMap contributors
                </a>
            </div>
        </DeckGL>
    );
}

export default App
