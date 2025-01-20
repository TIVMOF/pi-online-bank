import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";
import { EntityUtils } from "../utils/EntityUtils";

export interface CardEntity {
    readonly Id: number;
    CardNumber: string;
    CV?: string;
    ExpirationDate?: Date;
    CardType: number;
    BankAccount?: number;
}

export interface CardCreateEntity {
    readonly CardNumber: string;
    readonly CV?: string;
    readonly ExpirationDate?: Date;
    readonly CardType: number;
    readonly BankAccount?: number;
}

export interface CardUpdateEntity extends CardCreateEntity {
    readonly Id: number;
}

export interface CardEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            CardNumber?: string | string[];
            CV?: string | string[];
            ExpirationDate?: Date | Date[];
            CardType?: number | number[];
            BankAccount?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            CardNumber?: string | string[];
            CV?: string | string[];
            ExpirationDate?: Date | Date[];
            CardType?: number | number[];
            BankAccount?: number | number[];
        };
        contains?: {
            Id?: number;
            CardNumber?: string;
            CV?: string;
            ExpirationDate?: Date;
            CardType?: number;
            BankAccount?: number;
        };
        greaterThan?: {
            Id?: number;
            CardNumber?: string;
            CV?: string;
            ExpirationDate?: Date;
            CardType?: number;
            BankAccount?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            CardNumber?: string;
            CV?: string;
            ExpirationDate?: Date;
            CardType?: number;
            BankAccount?: number;
        };
        lessThan?: {
            Id?: number;
            CardNumber?: string;
            CV?: string;
            ExpirationDate?: Date;
            CardType?: number;
            BankAccount?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            CardNumber?: string;
            CV?: string;
            ExpirationDate?: Date;
            CardType?: number;
            BankAccount?: number;
        };
    },
    $select?: (keyof CardEntity)[],
    $sort?: string | (keyof CardEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface CardEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<CardEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface CardUpdateEntityEvent extends CardEntityEvent {
    readonly previousEntity: CardEntity;
}

export class CardRepository {

    private static readonly DEFINITION = {
        table: "CARD",
        properties: [
            {
                name: "Id",
                column: "CARD_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "CardNumber",
                column: "CARD_CARDNUMBER",
                type: "VARCHAR",
                required: true
            },
            {
                name: "CV",
                column: "CARD_CV",
                type: "VARCHAR",
            },
            {
                name: "ExpirationDate",
                column: "CARD_EXPIRATIONDATE",
                type: "DATE",
            },
            {
                name: "CardType",
                column: "CARD_CARDTYPE",
                type: "INTEGER",
                required: true
            },
            {
                name: "BankAccount",
                column: "CARD_BANKACCOUNT",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(CardRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: CardEntityOptions): CardEntity[] {
        return this.dao.list(options).map((e: CardEntity) => {
            EntityUtils.setDate(e, "ExpirationDate");
            return e;
        });
    }

    public findById(id: number): CardEntity | undefined {
        const entity = this.dao.find(id);
        EntityUtils.setDate(entity, "ExpirationDate");
        return entity ?? undefined;
    }

    public create(entity: CardCreateEntity): number {
        EntityUtils.setLocalDate(entity, "ExpirationDate");
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CARD",
            entity: entity,
            key: {
                name: "Id",
                column: "CARD_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: CardUpdateEntity): void {
        // EntityUtils.setLocalDate(entity, "ExpirationDate");
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CARD",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "CARD_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: CardCreateEntity | CardUpdateEntity): number {
        const id = (entity as CardUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as CardUpdateEntity);
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
            table: "CARD",
            entity: entity,
            key: {
                name: "Id",
                column: "CARD_ID",
                value: id
            }
        });
    }

    public count(options?: CardEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CARD"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: CardEntityEvent | CardUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("pi-bank-backend-card-Card", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("pi-bank-backend-card-Card").send(JSON.stringify(data));
    }
}
