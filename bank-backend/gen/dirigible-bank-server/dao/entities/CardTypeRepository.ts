import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface CardTypeEntity {
    readonly Id: number;
    Name?: string;
}

export interface CardTypeCreateEntity {
    readonly Name?: string;
}

export interface CardTypeUpdateEntity extends CardTypeCreateEntity {
    readonly Id: number;
}

export interface CardTypeEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        contains?: {
            Id?: number;
            Name?: string;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
    },
    $select?: (keyof CardTypeEntity)[],
    $sort?: string | (keyof CardTypeEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface CardTypeEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<CardTypeEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface CardTypeUpdateEntityEvent extends CardTypeEntityEvent {
    readonly previousEntity: CardTypeEntity;
}

export class CardTypeRepository {

    private static readonly DEFINITION = {
        table: "CARDTYPE",
        properties: [
            {
                name: "Id",
                column: "CARDTYPE_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "CARDTYPE_NAME",
                type: "VARCHAR",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(CardTypeRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: CardTypeEntityOptions): CardTypeEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): CardTypeEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: CardTypeCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CARDTYPE",
            entity: entity,
            key: {
                name: "Id",
                column: "CARDTYPE_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: CardTypeUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CARDTYPE",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "CARDTYPE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: CardTypeCreateEntity | CardTypeUpdateEntity): number {
        const id = (entity as CardTypeUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as CardTypeUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "CARDTYPE",
            entity: entity,
            key: {
                name: "Id",
                column: "CARDTYPE_ID",
                value: id
            }
        });
    }

    public count(options?: CardTypeEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CARDTYPE"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: CardTypeEntityEvent | CardTypeUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("dirigible-bank-server-entities-CardType", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("dirigible-bank-server-entities-CardType").send(JSON.stringify(data));
    }
}
