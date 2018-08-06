import { Transformer, TransformerContext } from "graphql-transform";
import {
    DirectiveNode,
    ObjectTypeDefinitionNode
} from "graphql";
import { ResourceFactory } from "./resources";
import {
    makeSearchableScalarInputObject, makeSearchableXFilterInputObject,
    makeSearchableSortDirectionEnumObject, makeSearchableXSortableFieldsEnumObject,
    makeSearchableXSortInputObject
} from "./definitions";
import {
    makeNamedType,
    blankObjectExtension,
    makeField,
    extensionWithFields,
    blankObject,
    makeListType,
    makeArg,
    makeNonNullType
} from "graphql-transformer-common";
import { ResolverResourceIDs, SearchableResourceIDs } from 'graphql-transformer-common'

interface QueryNameMap {
    search?: string;
}

interface ModelDirectiveArgs {
    queries?: QueryNameMap
}

/**
 * Handles the @searchable directive on OBJECT types.
 */
export class AppSyncSearchableTransformer extends Transformer {
    resources: ResourceFactory;

    constructor() {
        super(
            `AppSyncSearchableTransformer`,
            `directive @searchable(queries: SearchableQueryMap) on OBJECT`,
            `
                input SearchableQueryMap { search: String }
            `
        );
        this.resources = new ResourceFactory();
    }

    public before = (ctx: TransformerContext): void => {
        const template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources);
        ctx.mergeParameters(template.Parameters);
    };

    /**
     * Given the initial input and context manipulate the context to handle this object directive.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    public object = (
        def: ObjectTypeDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ): void => {

        const directiveArguments: ModelDirectiveArgs = super.getDirectiveArgumentMap(directive)
        let shouldMakeSearch = true;
        let searchFieldNameOverride = undefined;

        // Figure out which queries to make and if they have name overrides.
        if (directiveArguments.queries) {
            if (!directiveArguments.queries.search) {
                shouldMakeSearch = false;
            } else {
                searchFieldNameOverride = directiveArguments.queries.search
            }
        }

        const typeName = def.name.value
        ctx.setResource(
            SearchableResourceIDs.SearchableEventSourceMappingID(typeName),
            this.resources.makeDynamoDBStreamEventSourceMapping(typeName)
        )

        //SearchablePostSortableFields
        let queryType = blankObjectExtension('Query')

        // Create listX
        if (shouldMakeSearch) {
            this.generateSearchableInputs(ctx, def)
            this.generateSearchableXConnectionType(ctx, def)

            const searchResolver = this.resources.makeSearchResolver(def.name.value, searchFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.ElasticsearchSearchResolverResourceID(def.name.value), searchResolver)
            queryType = extensionWithFields(
                queryType,
                [
                    makeField(
                        searchResolver.Properties.FieldName,
                        [
                            makeArg('filter', makeNamedType(`Searchable${def.name.value}FilterInput`)),
                            makeArg('sort', makeNamedType(`Searchable${def.name.value}SortInput`)),
                            makeArg('limit', makeNamedType('Int')),
                            makeArg('nextToken', makeNamedType('String'))
                        ],
                        makeNamedType(`Searchable${def.name.value}Connection`)
                    )
                ]
            )
        }

        ctx.addObjectExtension(queryType)
    };

    private generateSearchableXConnectionType(ctx: TransformerContext, def: ObjectTypeDefinitionNode): void {
        const searchableXConnectionName = `Searchable${def.name.value}Connection`
        if (this.typeExist(searchableXConnectionName, ctx)) {
            return
        }

        // Create the TableXConnection
        const connectionType = blankObject(searchableXConnectionName)
        ctx.addObject(connectionType)

        // Create TableXConnection type with items and nextToken
        let connectionTypeExtension = blankObjectExtension(searchableXConnectionName)
        connectionTypeExtension = extensionWithFields(
            connectionTypeExtension,
            [makeField(
                'items',
                [],
                makeListType(makeNamedType(def.name.value))
            )]
        )
        connectionTypeExtension = extensionWithFields(
            connectionTypeExtension,
            [makeField(
                'nextToken',
                [],
                makeNamedType('String')
            )]
        )
        ctx.addObjectExtension(connectionTypeExtension)
    }

    private typeExist(type: string, ctx: TransformerContext): boolean {
        return Boolean(type in ctx.nodeMap);
    }

    private generateSearchableInputs(ctx: TransformerContext, def: ObjectTypeDefinitionNode): void {

        // Create the Scalar filter inputs
        if (!this.typeExist('SearchableStringFilterInput', ctx)) {
            const searchableStringFilterInput = makeSearchableScalarInputObject('String')
            ctx.addInput(searchableStringFilterInput)
        }

        if (!this.typeExist('SearchableIDFilterInput', ctx)) {
            const searchableIDFilterInput = makeSearchableScalarInputObject('ID')
            ctx.addInput(searchableIDFilterInput)
        }

        if (!this.typeExist('SearchableIntFilterInput', ctx)) {
            const searchableIntFilterInput = makeSearchableScalarInputObject('Int')
            ctx.addInput(searchableIntFilterInput)
        }

        if (!this.typeExist('SearchableFloatFilterInput', ctx)) {
            const searchableFloatFilterInput = makeSearchableScalarInputObject('Float')
            ctx.addInput(searchableFloatFilterInput)
        }

        if (!this.typeExist('SearchableBooleanFilterInput', ctx)) {
            const searchableBooleanFilterInput = makeSearchableScalarInputObject('Boolean')
            ctx.addInput(searchableBooleanFilterInput)
        }

        if (!this.typeExist(`Searchable${def.name.value}FilterInput`, ctx)) {
            const searchableXQueryFilterInput = makeSearchableXFilterInputObject(def)
            ctx.addInput(searchableXQueryFilterInput)
        }

        if (!this.typeExist('SearchableSortDirection', ctx)) {
            const searchableSortDirection = makeSearchableSortDirectionEnumObject()
            ctx.addEnum(searchableSortDirection)
        }

        if (!this.typeExist(`Searchable${def.name.value}SortableFields`, ctx)) {
            const searchableXSortableFieldsDirection = makeSearchableXSortableFieldsEnumObject(def)
            ctx.addEnum(searchableXSortableFieldsDirection)
        }

        if (!this.typeExist(`Searchable${def.name.value}SortInput`, ctx)) {
            const searchableXSortableInputDirection = makeSearchableXSortInputObject(def)
            ctx.addInput(searchableXSortableInputDirection)
        }
    }
}