import { Controller, Get, Post, Put, Delete, response } from "sdk/http"
import { Extensions } from "sdk/extensions"
import { UsersRepository, UsersEntityOptions } from "../../dao/users/UsersRepository";
import { ValidationError } from "../utils/ValidationError";
import { HttpUtils } from "../utils/HttpUtils";

const validationModules = await Extensions.loadExtensionModules("dirigible-bank-server-users-Users", ["validate"]);

@Controller
class UsersService {

    private readonly repository = new UsersRepository();

    @Get("/")
    public getAll(_: any, ctx: any) {
        try {
            const options: UsersEntityOptions = {
                $limit: ctx.queryParameters["$limit"] ? parseInt(ctx.queryParameters["$limit"]) : undefined,
                $offset: ctx.queryParameters["$offset"] ? parseInt(ctx.queryParameters["$offset"]) : undefined
            };

            return this.repository.findAll(options);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    @Post("/")
    public create(entity: any) {
        try {
            this.validateEntity(entity);
            entity.Id = this.repository.create(entity);
            response.setHeader("Content-Location", "/services/ts/dirigible-bank-server/gen/dirigible-bank-server/api/users/UsersService.ts/" + entity.Id);
            response.setStatus(response.CREATED);
            return entity;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    @Get("/count")
    public count() {
        try {
            return this.repository.count();
        } catch (error: any) {
            this.handleError(error);
        }
    }

    @Post("/count")
    public countWithFilter(filter: any) {
        try {
            return this.repository.count(filter);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    @Post("/search")
    public search(filter: any) {
        try {
            return this.repository.findAll(filter);
        } catch (error: any) {
            this.handleError(error);
        }
    }

    @Get("/:id")
    public getById(_: any, ctx: any) {
        try {
            const id = parseInt(ctx.pathParameters.id);
            const entity = this.repository.findById(id);
            if (entity) {
                return entity;
            } else {
                HttpUtils.sendResponseNotFound("Users not found");
            }
        } catch (error: any) {
            this.handleError(error);
        }
    }

    @Put("/:id")
    public update(entity: any, ctx: any) {
        try {
            entity.Id = ctx.pathParameters.id;
            this.validateEntity(entity);
            this.repository.update(entity);
            return entity;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    @Delete("/:id")
    public deleteById(_: any, ctx: any) {
        try {
            const id = ctx.pathParameters.id;
            const entity = this.repository.findById(id);
            if (entity) {
                this.repository.deleteById(id);
                HttpUtils.sendResponseNoContent();
            } else {
                HttpUtils.sendResponseNotFound("Users not found");
            }
        } catch (error: any) {
            this.handleError(error);
        }
    }

    private handleError(error: any) {
        if (error.name === "ForbiddenError") {
            HttpUtils.sendForbiddenRequest(error.message);
        } else if (error.name === "ValidationError") {
            HttpUtils.sendResponseBadRequest(error.message);
        } else {
            HttpUtils.sendInternalServerError(error.message);
        }
    }

    private validateEntity(entity: any): void {
        if (entity.FName === null || entity.FName === undefined) {
            throw new ValidationError(`The 'FName' property is required, provide a valid value`);
        }
        if (entity.FName?.length > 255) {
            throw new ValidationError(`The 'FName' exceeds the maximum length of [255] characters`);
        }
        if (entity.LName === null || entity.LName === undefined) {
            throw new ValidationError(`The 'LName' property is required, provide a valid value`);
        }
        if (entity.LName?.length > 255) {
            throw new ValidationError(`The 'LName' exceeds the maximum length of [255] characters`);
        }
        if (entity.Email === null || entity.Email === undefined) {
            throw new ValidationError(`The 'Email' property is required, provide a valid value`);
        }
        if (entity.Email?.length > 700) {
            throw new ValidationError(`The 'Email' exceeds the maximum length of [700] characters`);
        }
        if (entity.Password === null || entity.Password === undefined) {
            throw new ValidationError(`The 'Password' property is required, provide a valid value`);
        }
        if (entity.Password?.length > 255) {
            throw new ValidationError(`The 'Password' exceeds the maximum length of [255] characters`);
        }
        if (entity.Phone?.length > 20) {
            throw new ValidationError(`The 'Phone' exceeds the maximum length of [20] characters`);
        }
        if (entity.Username === null || entity.Username === undefined) {
            throw new ValidationError(`The 'Username' property is required, provide a valid value`);
        }
        if (entity.Username?.length > 900) {
            throw new ValidationError(`The 'Username' exceeds the maximum length of [900] characters`);
        }
        for (const next of validationModules) {
            next.validate(entity);
        }
    }

}
