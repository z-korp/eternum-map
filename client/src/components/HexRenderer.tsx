// components/HexRenderer.ts
import * as PIXI from 'pixi.js';
import { Grid, Hex, hexToPoint } from 'honeycomb-grid';
import { Realm } from '../types';

class HexRenderer {
  private hexContainer: PIXI.Container;
  private hexMapRef: React.MutableRefObject<
    Map<string, { container: PIXI.Container; hex: Hex }>
  >;
  private rcsTexturesRef: React.MutableRefObject<Record<
    string,
    PIXI.Texture
  > | null>;
  private realmsRef: React.MutableRefObject<Realm[]>;
  private onRealmHover: (realm: Realm | null) => void;
  private hexSize: number;
  private containerRealmMap: WeakMap<PIXI.Container, Realm>;

  constructor(
    hexContainer: PIXI.Container,
    hexMapRef: React.MutableRefObject<
      Map<string, { container: PIXI.Container; hex: Hex }>
    >,
    rcsTexturesRef: React.MutableRefObject<Record<string, PIXI.Texture> | null>,
    realmsRef: React.MutableRefObject<Realm[]>,
    onRealmHover: (realm: Realm | null) => void,
    hexSize: number
  ) {
    this.hexContainer = hexContainer;
    this.hexMapRef = hexMapRef;
    this.rcsTexturesRef = rcsTexturesRef;
    this.realmsRef = realmsRef;
    this.onRealmHover = onRealmHover;
    this.hexSize = hexSize;
    this.containerRealmMap = new WeakMap<PIXI.Container, Realm>();
  }

  createHexDiscoveredContainer(hex: Hex, color: string): PIXI.Container {
    const hexAndTextContainer = new PIXI.Container();
    hexAndTextContainer.x = 0;
    hexAndTextContainer.y = 0;

    const graphics = new PIXI.Graphics();

    graphics
      .poly(hex.corners)
      .fill(color)
      .stroke({ width: 1, color: 0xd3d3d3, alignment: 1 }); // Inner 1px gray border

    hexAndTextContainer.addChild(graphics);

    return hexAndTextContainer;
  }

  createHexContainer(
    hex: Hex,
    realmOverride: Realm | undefined,
    displayText = false
  ): PIXI.Container {
    const point = hexToPoint(hex);
    const hexAndTextContainer = new PIXI.Container();
    hexAndTextContainer.x = 0;
    hexAndTextContainer.y = 0;

    const graphics = new PIXI.Graphics();
    const realm =
      realmOverride ||
      this.realmsRef.current.find(
        (realm) =>
          realm?.coordinates?.x === hex.col && realm?.coordinates?.y === hex.row
      );

    if (realm) {
      graphics
        .poly(hex.corners)
        .fill(0xffd700)
        .stroke({ width: 2, color: 0x000000, alignment: 0.5 }); // Centered 2px black border
    } else {
      graphics
        .poly(hex.corners)
        .fill(0xffffff, 0)
        .stroke({ width: 1, color: 0xd3d3d3, alignment: 1 }); // Inner 1px gray border
    }

    hexAndTextContainer.addChild(graphics);

    // Debug text if needed
    if (displayText) {
      const debugText = new PIXI.Text(`(${hex.col},${hex.row})`, {
        fill: 0x000000,
        fontSize: 10,
        fontFamily: 'Arial',
      });
      debugText.anchor.set(0.5);
      debugText.position.set(point.x, point.y);
      debugText.name = 'debugText';
      hexAndTextContainer.addChild(debugText);
    }

    // Handle resource sprites
    if (realm) {
      this.addResourceSpritesToHex(hexAndTextContainer, realm, point);
    }

    // Setup pointer interactivity
    this.setupHexInteractivity(graphics, realm);

    return hexAndTextContainer;
  }

  private addResourceSpritesToHex(
    container: PIXI.Container,
    realm: Realm,
    point: { x: number; y: number }
  ) {
    if (!realm || !this.rcsTexturesRef.current) return;

    realm.resources.forEach((resourceId, index) => {
      const angleOffset = (0 * Math.PI) / 180;
      const angle =
        (index * 2 * Math.PI) / realm.resources.length + angleOffset;
      const radius = 16;
      const filename = `${resourceId}.png`;

      if (
        this.rcsTexturesRef.current &&
        this.rcsTexturesRef.current[filename]
      ) {
        const resourceSprite = new PIXI.Sprite(
          this.rcsTexturesRef.current[filename]
        );
        resourceSprite.anchor.set(0.5);
        resourceSprite.width = this.hexSize / 1.5;
        resourceSprite.height = this.hexSize / 1.5;
        resourceSprite.position.set(
          point.x + radius * Math.cos(angle),
          point.y + radius * Math.sin(angle)
        );
        container.addChild(resourceSprite);
      }
    });
  }

  private setupHexInteractivity(
    graphics: PIXI.Graphics,
    realm: Realm | undefined
  ) {
    graphics.eventMode = 'static';
    graphics.cursor = 'grab';

    const updateHoverState = (isOver: boolean) => {
      if (isOver) {
        graphics.tint = 0xffff00;
        if (realm) {
          this.onRealmHover(realm);
        }
      } else {
        graphics.tint = 0xffffff;
        this.onRealmHover(null);
      }
    };

    graphics.on('pointerover', () => updateHoverState(true));
    graphics.on('pointerout', () => updateHoverState(false));
  }

  updateHexContainer(
    container: PIXI.Container,
    hex: Hex,
    realm: Realm | undefined
  ): PIXI.Container {
    const graphics = container.getChildAt(0) as PIXI.Graphics;
    const point = hexToPoint(hex);

    // Update the graphics
    graphics.clear();
    if (realm) {
      graphics
        .poly(hex.corners)
        .fill(0xffd700)
        .stroke({ width: 2, color: 0x000000, alignment: 0.5 });
    } else {
      graphics
        .poly(hex.corners)
        .stroke({ width: 1, color: 0xd3d3d3, alignment: 1 });
    }

    // Remove all children except the graphics
    while (container.children.length > 1) {
      container.removeChildAt(1);
    }

    // Update hover handlers
    graphics.removeAllListeners();
    this.setupHexInteractivity(graphics, realm);

    // Add resource sprites
    if (realm) {
      this.addResourceSpritesToHex(container, realm, point);
    }

    return container;
  }

  updateVisibleRealmHexes(
    grid: Grid<Hex>,
    app: PIXI.Application,
    hexSize: number
  ) {
    if (!grid || !app || !this.hexContainer) return;

    // Determine visible bounds with margins
    const topLeft = this.hexContainer.toLocal({ x: 0, y: 0 });
    const bottomRight = this.hexContainer.toLocal({
      x: app.screen.width,
      y: app.screen.height,
    });

    const minX = Math.min(topLeft.x, bottomRight.x);
    const maxX = Math.max(topLeft.x, bottomRight.x);
    const minY = Math.min(topLeft.y, bottomRight.y);
    const maxY = Math.max(topLeft.y, bottomRight.y);

    const marginX = hexSize * 24;
    const marginY = hexSize * 15;
    const expandedMinX = minX - marginX;
    const expandedMaxX = maxX + marginX;
    const expandedMinY = minY - marginY;
    const expandedMaxY = maxY + marginY;

    // Find visible hexes with realms
    const visibleRealmHexes = [];
    const visibleKeys = new Set();

    for (const hex of grid) {
      const point = hexToPoint(hex);
      if (
        point.x >= expandedMinX &&
        point.x <= expandedMaxX &&
        point.y >= expandedMinY &&
        point.y <= expandedMaxY
      ) {
        const key = `${hex.col},${hex.row}`;
        visibleKeys.add(key);

        const realm = this.realmsRef.current.find(
          (r) => r.coordinates.x === hex.col && r.coordinates.y === hex.row
        );

        if (realm) {
          visibleRealmHexes.push({ hex, key, realm, point });
        }
      }
    }

    // Sort realm tiles to draw on top
    visibleRealmHexes.sort((a) => (a.realm ? 1 : -1));

    // Create or update containers for realm tiles
    visibleRealmHexes.forEach(({ hex, key, realm }) => {
      if (!this.hexMapRef.current.has(key)) {
        const container = this.createHexContainer(hex, realm, false);
        this.containerRealmMap.set(container, realm);
        this.hexMapRef.current.set(key, { container, hex });
        this.hexContainer.addChild(container);
      } else {
        const { container } = this.hexMapRef.current.get(key)!;
        const existingRealm = this.containerRealmMap.get(container);
        const realmChanged =
          existingRealm?.realmId !== realm?.realmId ||
          (existingRealm === undefined && realm !== undefined) ||
          (existingRealm !== undefined && realm === undefined);

        if (realmChanged) {
          this.updateHexContainer(container, hex, realm);
          if (realm) {
            this.containerRealmMap.set(container, realm);
          } else {
            this.containerRealmMap.delete(container);
          }
          // Reorder container
          this.hexContainer.removeChild(container);
          this.hexContainer.addChild(container);
        }
      }
    });

    // Clean up containers not in visible bounds
    this.hexMapRef.current.forEach((value, key) => {
      if (!visibleKeys.has(key)) {
        this.hexContainer.removeChild(value.container);
        this.containerRealmMap.delete(value.container);
        value.container.destroy({ children: true });
        this.hexMapRef.current.delete(key);
      }
    });
  }
}

export default HexRenderer;
