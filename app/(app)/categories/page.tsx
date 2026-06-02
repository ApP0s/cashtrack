import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { getCategories, type Category } from "@/lib/queries";
import { deleteCategoryAction } from "@/lib/actions";
import { CategoryForm } from "@/components/category-form";

export default async function CategoriesPage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);
  const tr = (k: string) => t(locale, k);
  const categories = await getCategories(user.id);

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{tr("cat.title")}</h1>
        <p className="text-sm text-muted">{tr("cat.subtitle")}</p>
      </header>

      <CategoryForm />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <CategoryGroup
          title={tr("cat.income")}
          items={income}
          emptyLabel={tr("cat.noCategories")}
          removeLabel={tr("common.remove")}
        />
        <CategoryGroup
          title={tr("cat.expense")}
          items={expense}
          emptyLabel={tr("cat.noCategories")}
          removeLabel={tr("common.remove")}
        />
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  items,
  emptyLabel,
  removeLabel,
}: {
  title: string;
  items: Category[];
  emptyLabel: string;
  removeLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-subtle"
            >
              <span className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </span>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-muted hover:text-expense"
                >
                  {removeLabel}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
